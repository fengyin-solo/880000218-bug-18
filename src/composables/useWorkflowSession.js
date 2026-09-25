import { computed, reactive } from 'vue'

import { restorationBatches, restorationSteps } from '../data/restorationData'

const STORAGE_KEY = 'restoration-workflow-v1'
const DAY_START_MINUTES = 9 * 60

// 与 restorationSteps 一一对应的预计耗时（分钟），第四步按原文“平整定型 8 小时”。
// 只补充排程元数据，不改动四步内容本身。
const STEP_DURATIONS = [40, 30, 50, 8 * 60]

const STEP_STATUSES = ['pending', 'done', 'cancelled']

function createSteps() {
  return restorationSteps.map((title, index) => ({
    id: `step-${index + 1}`,
    order: index + 1,
    title,
    status: 'pending',
    completedSlot: null,
  }))
}

function isValidSlot(slot) {
  return (
    slot &&
    Number.isFinite(slot.start) &&
    Number.isFinite(slot.end)
  )
}

function hydrate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const payload = JSON.parse(raw)
    if (payload?.version !== 1 || !Array.isArray(payload.steps)) return null
    if (payload.steps.length !== restorationSteps.length) return null
    // 四步内容始终以数据文件为准，缓存只恢复状态，避免旧值污染工序文本。
    return restorationSteps.map((title, index) => {
      const cached = payload.steps[index] ?? {}
      return {
        id: `step-${index + 1}`,
        order: index + 1,
        title,
        status: STEP_STATUSES.includes(cached.status) ? cached.status : 'pending',
        completedSlot: isValidSlot(cached.completedSlot) ? cached.completedSlot : null,
      }
    })
  } catch {
    return null
  }
}

function persist(steps) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, steps }),
    )
  } catch {
    // 隐私模式等场景下降级为内存态，不影响当次会话。
  }
}

// 预计时段完全由当前状态推导：已取消的工序不占时段，后续工序自动提前；
// 恢复后重新占位，后续工序自动顺延。不做任何缓存，因此永远不会显示旧值。
function computeSchedule(steps) {
  let cursor = DAY_START_MINUTES
  return steps.map((step, index) => {
    const duration = STEP_DURATIONS[index]
    if (step.status === 'cancelled') return null
    if (step.status === 'done') {
      cursor += duration
      return step.completedSlot
    }
    const slot = { start: cursor, end: cursor + duration }
    cursor += duration
    return slot
  })
}

const state = reactive({
  steps: hydrate() ?? createSteps(),
  revision: 0,
  history: [],
  lastRejection: null,
})

function commit(step, intent) {
  state.revision += 1
  // 只有被拒绝的那次流转最终成功时才清除拒绝记录；
  // 修复前置条件的其他提交不应带走“重试”入口。
  if (
    state.lastRejection &&
    state.lastRejection.stepId === step.id &&
    state.lastRejection.intent === intent
  ) {
    state.lastRejection = null
  }
  state.history.push({ stepId: step.id, intent, revision: state.revision })
  // 所有变更都经由 commit，同步落盘，避免异步 watch 的时序窗口。
  persist(state.steps)
  return { ok: true, deduped: false, revision: state.revision }
}

function reject(step, intent, reason, message) {
  // 不触碰 steps，保留最后一次有效次序，由调用方决定何时重试。
  state.lastRejection = { stepId: step.id, intent, reason, message }
  return { ok: false, reason, message }
}

function deduped(message = '重复提交已忽略，保留最后一次有效次序') {
  return { ok: true, deduped: true, message }
}

const handlers = {
  complete(step) {
    if (step.status === 'done') return deduped()
    if (step.status === 'cancelled') {
      return reject(step, 'complete', 'step-cancelled', '该工序已取消，请先恢复再完成')
    }
    const missing = state.steps.find(
      (item) => item.order < step.order && item.status === 'pending',
    )
    if (missing) {
      return reject(
        step,
        'complete',
        'missing-previous',
        `第 ${missing.order} 步尚未完成，已保留当前次序，可先处理前置工序后重试`,
      )
    }
    step.completedSlot = computeSchedule(state.steps)[step.order - 1]
    step.status = 'done'
    return commit(step, 'complete')
  },
  cancel(step) {
    if (step.status === 'cancelled') return deduped()
    if (step.status === 'done') {
      return reject(step, 'cancel', 'already-done', '已完成的工序不可取消')
    }
    step.status = 'cancelled'
    return commit(step, 'cancel')
  },
  restore(step) {
    if (step.status !== 'cancelled') return deduped()
    step.status = 'pending'
    return commit(step, 'restore')
  },
}

// 完成、取消、恢复统一走同一个流转入口。
function transitionStep(stepId, intent) {
  const step = state.steps.find((item) => item.id === stepId)
  if (!step) return { ok: false, reason: 'unknown-step', message: '未找到对应工序' }
  const handler = handlers[intent]
  if (!handler) return { ok: false, reason: 'unknown-intent', message: '未知的流转动作' }
  return handler(step)
}

function retryLastTransition() {
  if (!state.lastRejection) {
    return { ok: false, reason: 'nothing-to-retry', message: '没有可重试的流转' }
  }
  const { stepId, intent } = state.lastRejection
  return transitionStep(stepId, intent)
}

// 当前进行中的工序是派生值：永远是第一个待处理工序，
// 完成后指针自然前进，不会停留在原步骤。
const activeStepId = computed(
  () => state.steps.find((step) => step.status === 'pending')?.id ?? null,
)

const schedule = computed(() => computeSchedule(state.steps))

const stepViews = computed(() =>
  state.steps.map((step, index) => ({
    ...step,
    displayStatus:
      step.status === 'pending' && step.id === activeStepId.value
        ? 'active'
        : step.status,
    slot: schedule.value[index],
  })),
)

const completedCount = computed(
  () => state.steps.filter((step) => step.status === 'done').length,
)

const progressLabel = computed(
  () => `进度 ${completedCount.value}/${state.steps.length}`,
)

// 阶段台账：看板批次卡与任务清单的唯一数据源，两边不会再各读各的副本。
const stageLedger = reactive(
  Object.fromEntries(restorationBatches.map((batch) => [batch.title, batch.status])),
)

function stageOf(title) {
  return stageLedger[title] ?? '待定'
}

export function useWorkflowSession() {
  return {
    stepViews,
    activeStepId,
    schedule,
    progressLabel,
    lastRejection: computed(() => state.lastRejection),
    transitionStep,
    retryLastTransition,
    stageOf,
  }
}
