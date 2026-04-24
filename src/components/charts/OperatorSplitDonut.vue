<script setup>
import { computed } from 'vue'
import PlotlyChart from './PlotlyChart.vue'

const props = defineProps({
  operators: { type: Array, required: true }, // [{ label, count, deliveryRate }]
  height: { type: [String, Number], default: 260 },
})

const COLORS = ['#1570ef', '#7839ee', '#12b76a', '#f79009', '#d92d20']

const entries = computed(() => props.operators.filter((o) => o.count > 0))

const traces = computed(() => [
  {
    type: 'pie',
    hole: 0.6,
    values: entries.value.map((o) => o.count),
    labels: entries.value.map((o) => o.label),
    marker: {
      colors: entries.value.map((_, i) => COLORS[i % COLORS.length]),
      line: { color: '#ffffff', width: 2 },
    },
    textinfo: 'label+percent',
    textfont: { size: 11, color: '#ffffff' },
    hovertemplate: '<b>%{label}</b><br>%{value:,.0f} msgs<br>%{percent}<extra></extra>',
    sort: false,
  },
])

const layout = computed(() => ({
  showlegend: false,
  margin: { l: 8, r: 8, t: 8, b: 8 },
}))
</script>

<template>
  <PlotlyChart :data="traces" :layout="layout" :height="height" />
</template>
