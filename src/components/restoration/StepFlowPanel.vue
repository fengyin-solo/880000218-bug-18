<script setup>
import {
  STEP_ACTIONS,
  STEP_STATUS,
  useStepWorkflow,
} from '../../composables/useStepWorkflow'
import { formatMinutes, stepStatusMeta } from '../../utils/restorationFormatters'

const { stepViews, currentStage, doneCount, totalSteps, lastResult, transition } =
  useStepWorkflow()
</script>

<template>
  <div class="step-flow">
    <div class="step-summary">
      <span>当前阶段：{{ currentStage }}</span>
      <span>进度 {{ doneCount }}/{{ totalSteps }}</span>
    </div>

    <p
      v-if="lastResult"
      :class="['step-feedback', lastResult.ok ? 'is-ok' : 'is-warn']"
    >
      {{ lastResult.message }}
    </p>

    <ol class="step-list">
      <li
        v-for="step in stepViews"
        :key="step.id"
        :class="['step-item', `step-item--${step.status}`]"
      >
        <div class="step-main">
          <span class="step-order">{{ step.order }}</span>
          <div class="step-body">
            <p class="step-text">{{ step.text }}</p>
            <small v-if="step.status === STEP_STATUS.DONE">
              已于 {{ formatMinutes(step.completedAt) }} 完成
            </small>
            <small v-else-if="step.status === STEP_STATUS.CANCELLED">
              已取消，恢复后重新排期
            </small>
            <small v-else>
              预计 {{ formatMinutes(step.slot.start) }} -
              {{ formatMinutes(step.slot.end) }}
            </small>
          </div>
        </div>
        <div class="step-side">
          <span
            :class="[
              'status-pill',
              `status-pill--${stepStatusMeta(step.status).tone}`,
            ]"
          >
            {{ stepStatusMeta(step.status).label }}
          </span>
          <div class="step-actions">
            <button
              v-if="step.status === STEP_STATUS.PENDING"
              type="button"
              class="action-btn action-btn--primary"
              @click="transition(step.id, STEP_ACTIONS.COMPLETE)"
            >
              完成
            </button>
            <button
              v-if="step.status !== STEP_STATUS.CANCELLED"
              type="button"
              class="action-btn"
              @click="transition(step.id, STEP_ACTIONS.CANCEL)"
            >
              取消
            </button>
            <button
              v-if="step.status === STEP_STATUS.CANCELLED"
              type="button"
              class="action-btn action-btn--primary"
              @click="transition(step.id, STEP_ACTIONS.RESTORE)"
            >
              恢复
            </button>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.step-flow {
  display: grid;
  gap: 14px;
}

.step-summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #775936;
  font-size: 0.86rem;
}

.step-feedback {
  margin: 0;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 0.84rem;
}

.step-feedback.is-ok {
  background: #d9ead9;
  color: #366338;
}

.step-feedback.is-warn {
  background: #efd0c9;
  color: #913d2f;
}

.step-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

.step-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(79, 57, 32, 0.08);
}

.step-item--cancelled {
  opacity: 0.72;
}

.step-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.step-order {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #efe2ca;
  color: #7e6038;
  font-size: 0.82rem;
  flex-shrink: 0;
}

.step-item--done .step-order {
  background: #d9ead9;
  color: #366338;
}

.step-body {
  display: grid;
  gap: 4px;
}

.step-text {
  margin: 0;
  color: #5c4a33;
}

.step-body small {
  color: #8a7454;
}

.step-side {
  display: grid;
  justify-items: end;
  gap: 8px;
  flex-shrink: 0;
}

.status-pill {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
}

.status-pill--pending {
  background: #f6e5b9;
  color: #8b6314;
}

.status-pill--done {
  background: #d9ead9;
  color: #366338;
}

.status-pill--cancelled {
  background: #efd0c9;
  color: #913d2f;
}

.step-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  font: inherit;
  font-size: 0.8rem;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(109, 80, 40, 0.28);
  background: transparent;
  color: #6a5439;
  cursor: pointer;
}

.action-btn--primary {
  background: #7e6038;
  border-color: transparent;
  color: #fdf8ef;
}

.action-btn:hover {
  filter: brightness(1.06);
}

@media (max-width: 640px) {
  .step-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .step-side {
    justify-items: start;
  }
}
</style>
