<script setup>
import { computed } from 'vue'

import PanelSection from '../components/common/PanelSection.vue'
import StatCard from '../components/common/StatCard.vue'
import BatchGrid from '../components/restoration/BatchGrid.vue'
import EnvironmentCards from '../components/restoration/EnvironmentCards.vue'
import HeroBanner from '../components/restoration/HeroBanner.vue'
import WorkflowSteps from '../components/restoration/WorkflowSteps.vue'
import {
  restorationBatches,
  restorationEnvironment,
  restorationHero,
} from '../data/restorationData'
import { useRestorationOverview } from '../composables/useRestorationOverview'
import { useWorkflowSession } from '../composables/useWorkflowSession'

const { batchCount, environmentCount, highRiskCount, ownerCount } =
  useRestorationOverview()
const { progressLabel, stageOf } = useWorkflowSession()

const statCards = computed(() => [
  { label: '在册批次', value: batchCount.value },
  { label: '高风险任务', value: highRiskCount.value },
  { label: '环境指标', value: environmentCount.value },
  { label: '参与修复师', value: ownerCount.value },
])

const batchItems = computed(() =>
  restorationBatches.map((batch) => ({
    ...batch,
    status: stageOf(batch.title),
  })),
)
</script>

<template>
  <div class="view-stack">
    <HeroBanner :hero="restorationHero" />

    <section class="stats-grid">
      <StatCard
        v-for="card in statCards"
        :key="card.label"
        :label="card.label"
        :value="card.value"
      />
    </section>

    <section class="two-column">
      <PanelSection title="重点批次" badge="优先处理">
        <BatchGrid :items="batchItems" />
      </PanelSection>

      <PanelSection title="当日工序" :badge="progressLabel">
        <WorkflowSteps />
      </PanelSection>
    </section>

    <PanelSection title="环境参数" badge="修复室 2">
      <EnvironmentCards :items="restorationEnvironment" />
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.two-column {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 24px;
}

@media (max-width: 980px) {
  .stats-grid,
  .two-column {
    grid-template-columns: 1fr;
  }
}
</style>
