<script setup>
import { computed } from 'vue'
import PlotlyChart from './PlotlyChart.vue'

// Adaptive funnel. For overall view: Submitted → Attempted → Delivered on
// primary → Fallback → Final delivered. For route views, pass a custom
// `stages` prop with { label, value } entries.
const props = defineProps({
  totals: { type: Object, default: null }, // { submitted, delivered, failed, fallbackTriggered, perChannel? }
  stages: { type: Array, default: null }, // explicit stages override
  height: { type: [String, Number], default: 360 },
})

const computedStages = computed(() => {
  if (props.stages) return props.stages
  const t = props.totals || {}
  const primaryAttempted =
    t.perChannel && Object.keys(t.perChannel).length
      ? Object.values(t.perChannel).reduce((a, v) => a + (v.attempted || 0), 0)
      : t.submitted || 0
  const primaryDelivered = Math.max((t.delivered || 0) - (t.fallbackTriggered || 0), 0)
  return [
    { label: 'Submitted', value: t.submitted || 0 },
    { label: 'Primary attempt', value: primaryAttempted },
    { label: 'Delivered on primary', value: primaryDelivered },
    { label: 'Fallback triggered', value: t.fallbackTriggered || 0 },
    { label: 'Final delivered', value: t.delivered || 0 },
  ]
})

const traces = computed(() => [
  {
    type: 'funnel',
    y: computedStages.value.map((s) => s.label),
    x: computedStages.value.map((s) => s.value),
    textinfo: 'value+percent initial',
    textfont: { color: '#ffffff', size: 12 },
    marker: {
      color: ['#1c73e8', '#3d6ede', '#12b76a', '#f79009', '#108c3d'],
      line: { color: '#ffffff', width: 1 },
    },
    connector: { line: { color: '#e4e7ec' } },
    hovertemplate: '<b>%{y}</b><br>%{x:,.0f}<extra></extra>',
  },
])

const layout = computed(() => ({
  showlegend: false,
  margin: { l: 160, r: 16, t: 8, b: 8 },
  yaxis: { automargin: true },
}))
</script>

<template>
  <PlotlyChart :data="traces" :layout="layout" :height="height" />
</template>
