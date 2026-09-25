<script setup>
import { computed } from 'vue'

import PanelSection from '../components/common/PanelSection.vue'
import BatchGrid from '../components/restoration/BatchGrid.vue'
import { restorationBatches } from '../data/restorationData'
import { useWorkflowSession } from '../composables/useWorkflowSession'

const { stageOf } = useWorkflowSession()

const items = computed(() =>
  restorationBatches.map((batch) => ({
    ...batch,
    status: stageOf(batch.title),
  })),
)
</script>

<template>
  <div class="view-stack">
    <PanelSection title="批次档案" badge="修复对象">
      <BatchGrid :items="items" />
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
}
</style>
