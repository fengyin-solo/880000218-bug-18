<script setup>
import { useWorkflowSession } from '../../composables/useWorkflowSession'
import { formatSlot, stepStatusMeta } from '../../utils/restorationFormatters'

const {
  stepViews,
  lastRejection,
  transitionStep,
  retryLastTransition,
} = useWorkflowSession()

function slotText(step) {
  if (step.displayStatus === 'done') return `已完成 · ${formatSlot(step.slot)}`
  if (step.displayStatus === 'cancelled') return '已取消 · 时段已释放'
  return `预计 ${formatSlot(step.slot)}`
}

// 待处理/进行中的工序都保留“完成”入口：越级提交会被状态机拦截，
// 保留最后一次有效次序并允许重试。
function canComplete(step) {
  return step.displayStatus === 'active' || step.displayStatus === 'pending'
}

function canCancel(step) {
  return step.displayStatus === 'active' || step.displayStatus === 'pending'
}

function canRestore(step) {
  return step.displayStatus === 'cancelled'
}
</script>

<template>
  <div class="workflow">
    <p v-if="lastRejection" class="rejection" role="alert">
      <span>{{ lastRejection.message }}</span>
      <button type="button" class="action-button action-button--ghost" @click="retryLastTransition">
        重试
      </button>
    </p>

    <ol class="step-list">
      <li
        v-for="step in stepViews"
        :key="step.id"
        :class="['step-item', `step-item--${step.displayStatus}`]"
      >
        <span class="step-order">{{ step.order }}</span>
        <div class="step-body">
          <p class="step-title">{{ step.title }}</p>
          <small class="step-slot">{{ slotText(step) }}</small>
        </div>
        <span :class="['step-pill', `step-pill--${stepStatusMeta(step.displayStatus).tone}`]">
          {{ stepStatusMeta(step.displayStatus).label }}
        </span>
        <div class="step-actions">
          <button
            v-if="canComplete(step)"
            type="button"
            class="action-button action-button--primary"
            @click="transitionStep(step.id, 'complete')"
          >
            完成
          </button>
          <button
            v-if="canCancel(step)"
            type="button"
            class="action-button action-button--ghost"
            @click="transitionStep(step.id, 'cancel')"
          >
            取消
          </button>
          <button
            v-if="canRestore(step)"
            type="button"
            class="action-button action-button--primary"
            @click="transitionStep(step.id, 'restore')"
          >
            恢复
          </button>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.workflow {
  display: grid;
  gap: 14px;
}

.rejection {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 10px 14px;
  border-radius: 14px;
  background: #efd0c9;
  color: #913d2f;
  font-size: 0.86rem;
}

.step-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.step-item {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(79, 57, 32, 0.08);
}

.step-item--done {
  opacity: 0.72;
}

.step-item--cancelled {
  border-style: dashed;
}

.step-order {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #efe2ca;
  color: #7e6038;
  font-size: 0.84rem;
  font-weight: 600;
}

.step-item--active .step-order {
  background: #5d4322;
  color: #fff8eb;
}

.step-body {
  display: grid;
  gap: 4px;
}

.step-title {
  margin: 0;
  color: #5c4a33;
}

.step-slot {
  color: #8a7250;
}

.step-pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  white-space: nowrap;
}

.step-pill--active {
  background: #f6e5b9;
  color: #8b6314;
}

.step-pill--pending {
  background: #efe2ca;
  color: #7e6038;
}

.step-pill--done {
  background: #d9ead9;
  color: #366338;
}

.step-pill--cancelled {
  background: #efd0c9;
  color: #913d2f;
}

.step-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.8rem;
  cursor: pointer;
}

.action-button--primary {
  background: #5d4322;
  color: #fff8eb;
}

.action-button--ghost {
  background: transparent;
  border-color: rgba(93, 67, 34, 0.35);
  color: #5d4322;
}

@media (max-width: 680px) {
  .step-item {
    grid-template-columns: auto 1fr;
  }

  .step-pill,
  .step-actions {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
