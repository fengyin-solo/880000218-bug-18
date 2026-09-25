<script setup>
import PanelSection from '../components/common/PanelSection.vue'
import StepFlowPanel from '../components/restoration/StepFlowPanel.vue'
import TaskTable from '../components/restoration/TaskTable.vue'
import { useStepWorkflow } from '../composables/useStepWorkflow'
import { restorationTasks } from '../data/restorationData'

const { currentStage } = useStepWorkflow()
</script>

<template>
  <div class="view-stack">
    <PanelSection title="当日工序" :badge="currentStage">
      <StepFlowPanel />
    </PanelSection>

    <PanelSection title="任务清单" badge="按风险排序">
      <TaskTable :rows="restorationTasks" />
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
  gap: 24px;
}
</style>
