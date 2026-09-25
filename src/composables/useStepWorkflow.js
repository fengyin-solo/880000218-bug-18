import { computed, reactive } from 'vue'

import { restorationSteps } from '../data/restorationData'

export const STEP_STATUS = Object.freeze({
  PENDING: 'pending',
  DONE: 'done',
  CANCELLED: 'cancelled',
})

export const STEP_ACTIONS = Object.freeze({
  COMPLETE: 'complete',
  CANCEL: 'cancel',
  RESTORE: 'restore',
})

// 每步预计耗时（分钟），仅用于排期展示，不改动原始工序文案。
const STEP_DURATIONS_MINUTES = [40, 30, 60, 45]
const DAY_START_MINUTES = 9 * 60

function currentMinutes() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

// 模块级状态：跨路由共享，退出总览再进入时进度保持最新。
const state = reactive({
  steps: restorationSteps.map((text, index) => ({
    id: `step-${index + 1}`,
    text,
    status: STEP_STATUS.PENDING,
    completedAt: null,
  })),
  lastResult: null,
})

function record(result) {
  state.lastResult = { ...result, at: Date.now() }
  return state.lastResult
}

// 完成、取消、恢复统一走同一个状态流转入口。
// 非法操作（重复提交、中间步骤缺失等）不改动状态，保留最后一次有效次序，允许重试。
export function transition(stepId, action) {
  const index = state.steps.findIndex((step) => step.id === stepId)
  if (index === -1) {
    return record({
      ok: false,
      reason: 'unknown-step',
      message: '未找到对应工序，已保留当前有效次序。',
    })
  }

  const step = state.steps[index]
  const order = index + 1

  if (action === STEP_ACTIONS.COMPLETE) {
    if (step.status === STEP_STATUS.DONE) {
      return record({
        ok: false,
        reason: 'duplicate',
        message: `第 ${order} 步已完成，重复提交已忽略，保留最后一次有效次序，可重试。`,
      })
    }
    if (step.status === STEP_STATUS.CANCELLED) {
      return record({
        ok: false,
        reason: 'cancelled-step',
        message: `第 ${order} 步已取消，请先恢复该步骤再完成，当前次序保持不变。`,
      })
    }
    const missingIndex = state.steps.findIndex(
      (item, itemIndex) => itemIndex < index && item.status !== STEP_STATUS.DONE,
    )
    if (missingIndex !== -1) {
      return record({
        ok: false,
        reason: 'missing-previous',
        message: `第 ${missingIndex + 1} 步尚未完成，已保留最后一次有效次序，请先完成前序步骤后重试。`,
      })
    }
    step.status = STEP_STATUS.DONE
    step.completedAt = currentMinutes()
    return record({
      ok: true,
      reason: 'completed',
      message: `第 ${order} 步已完成，后续步骤的预计时段已顺延。`,
    })
  }

  if (action === STEP_ACTIONS.CANCEL) {
    if (step.status === STEP_STATUS.CANCELLED) {
      return record({
        ok: false,
        reason: 'duplicate',
        message: `第 ${order} 步已处于取消状态，重复提交已忽略，保留最后一次有效次序，可重试。`,
      })
    }
    let reverted = 0
    if (step.status === STEP_STATUS.DONE) {
      // 回退其后的已完成步骤，保证已完成次序始终是连续前缀，不出现错位。
      state.steps.forEach((item, itemIndex) => {
        if (itemIndex > index && item.status === STEP_STATUS.DONE) {
          item.status = STEP_STATUS.PENDING
          item.completedAt = null
          reverted += 1
        }
      })
    }
    step.status = STEP_STATUS.CANCELLED
    step.completedAt = null
    return record({
      ok: true,
      reason: 'cancelled',
      message:
        reverted > 0
          ? `第 ${order} 步已取消，后续 ${reverted} 个已完成步骤已回退，次序保持有效。`
          : `第 ${order} 步已取消，其余工序次序保持不变。`,
    })
  }

  if (action === STEP_ACTIONS.RESTORE) {
    if (step.status !== STEP_STATUS.CANCELLED) {
      return record({
        ok: false,
        reason: step.status === STEP_STATUS.DONE ? 'duplicate' : 'not-cancelled',
        message:
          step.status === STEP_STATUS.DONE
            ? `第 ${order} 步已完成，无需恢复，重复提交已忽略。`
            : `第 ${order} 步未被取消，无需恢复，当前次序保持不变。`,
      })
    }
    step.status = STEP_STATUS.PENDING
    return record({
      ok: true,
      reason: 'restored',
      message: `第 ${order} 步已恢复为待处理，可继续按顺序完成。`,
    })
  }

  return record({
    ok: false,
    reason: 'unknown-action',
    message: '未知操作，已保留当前有效次序。',
  })
}

// 预计时段：已完成步骤以实际完成时间锚定，待处理步骤从上一完成点起依次顺延，
// 已取消步骤不参与排期，恢复后重新进入排期。
const stepViews = computed(() => {
  let cursor = null
  return state.steps.map((step, index) => {
    const duration = STEP_DURATIONS_MINUTES[index]
    const view = {
      id: step.id,
      order: index + 1,
      text: step.text,
      status: step.status,
      completedAt: step.completedAt,
      duration,
      slot: null,
    }
    if (step.status === STEP_STATUS.DONE) {
      cursor = step.completedAt + duration
      return view
    }
    if (step.status === STEP_STATUS.CANCELLED) {
      return view
    }
    const start = cursor ?? DAY_START_MINUTES
    view.slot = { start, end: start + duration }
    cursor = view.slot.end
    return view
  })
})

const doneCount = computed(
  () => state.steps.filter((step) => step.status === STEP_STATUS.DONE).length,
)

const totalSteps = computed(() => state.steps.length)

// 当前阶段由同一状态派生，工序列表与总览看板展示保持一致。
const currentStage = computed(() => {
  const nextIndex = state.steps.findIndex((step) => step.status === STEP_STATUS.PENDING)
  if (nextIndex !== -1) {
    return state.steps[nextIndex].text.slice(0, 4)
  }
  if (state.steps.some((step) => step.status === STEP_STATUS.CANCELLED)) {
    return '待恢复'
  }
  return '已完成'
})

const lastResult = computed(() => state.lastResult)

export function useStepWorkflow() {
  return {
    stepViews,
    currentStage,
    doneCount,
    totalSteps,
    lastResult,
    transition,
  }
}
