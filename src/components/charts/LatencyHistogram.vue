<script setup>
import { computed } from 'vue'
import PlotlyChart from './PlotlyChart.vue'

const props = defineProps({
  buckets: { type: Array, required: true }, // [{ upper, label, count }]
  height: { type: [String, Number], default: 260 },
})

const traces = computed(() => [
  {
    type: 'bar',
    x: props.buckets.map((b) => b.label),
    y: props.buckets.map((b) => b.count),
    marker: { color: '#375DFB', line: { width: 0 } },
    hovertemplate: '<b>≤ %{x}</b><br>%{y:,.0f} messages<extra></extra>',
    text: props.buckets.map((b) => (b.count > 0 ? b.count.toLocaleString() : '')),
    textposition: 'outside',
    textfont: { size: 10, color: '#667085' },
  },
])

const layout = computed(() => ({
  showlegend: false,
  margin: { l: 56, r: 16, t: 8, b: 40 },
  xaxis: { title: { text: 'Latency bucket', font: { size: 11 } } },
  yaxis: { tickformat: ',d', title: { text: 'Messages', font: { size: 11 } } },
  bargap: 0.2,
}))
</script>

<template>
  <PlotlyChart :data="traces" :layout="layout" :height="height" />
</template>
