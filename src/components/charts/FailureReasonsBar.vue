<script setup>
import { computed } from 'vue'
import PlotlyChart from './PlotlyChart.vue'

const props = defineProps({
  reasons: { type: Array, required: true }, // [{ key, label, count }]
  height: { type: [String, Number], default: 280 },
})

const sorted = computed(() =>
  [...props.reasons].filter((r) => r.count > 0).sort((a, b) => a.count - b.count),
)

const traces = computed(() => [
  {
    type: 'bar',
    orientation: 'h',
    y: sorted.value.map((r) => r.label),
    x: sorted.value.map((r) => r.count),
    marker: {
      color: sorted.value.map((r) =>
        r.key === 'inactive-template' ? '#f79009' : '#d92d20',
      ),
      line: { width: 0 },
    },
    text: sorted.value.map((r) => r.count.toLocaleString()),
    textposition: 'outside',
    textfont: { size: 11, color: '#475467' },
    hovertemplate: '<b>%{y}</b><br>%{x:,.0f} failures<extra></extra>',
  },
])

const layout = computed(() => ({
  showlegend: false,
  margin: { l: 160, r: 48, t: 8, b: 28 },
  xaxis: { tickformat: ',d' },
  yaxis: { automargin: true },
  bargap: 0.35,
}))
</script>

<template>
  <PlotlyChart :data="traces" :layout="layout" :height="height" />
</template>
