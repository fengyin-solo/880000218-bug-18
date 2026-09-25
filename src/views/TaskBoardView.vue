<script setup>
import { computed } from 'vue'

import PanelSection from '../components/common/PanelSection.vue'
import TaskTable from '../components/restoration/TaskTable.vue'
import WorkflowSteps from '../components/restoration/WorkflowSteps.vue'
import { restorationTasks } from '../data/restorationData'
import { useWorkflowSession } from '../composables/useWorkflowSession'

const { progressLabel, stageOf } = useWorkflowSession()

const rows = computed(() =>
  restorationTasks.map((task) => ({
    ...task,
    stage: stageOf(task.title),
  })),
)
</script>

<template>
  <div class="view-stack">
    <PanelSection title="当日工序" :badge="progressLabel">
      <WorkflowSteps />
    </PanelSection>

    <PanelSection title="任务清单" badge="按风险排序">
      <TaskTable :rows="rows" />
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
  gap: 24px;
}
</style>
