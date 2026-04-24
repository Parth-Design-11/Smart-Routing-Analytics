<script setup>
import { computed } from 'vue'
import PlotlyChart from './PlotlyChart.vue'
import { ROUTE_TYPE_META } from '@/mock/routes'

const props = defineProps({
  counts: { type: Object, required: true }, // { sms, 'rcs+sms', ... }
  height: { type: [String, Number], default: 260 },
})

const COLORS = {
  sms: '#375DFB',
  'rcs+sms': '#5E7BFC',
  'tc+sms': '#85A0FD',
  multi: '#ADC5FE',
}

const entries = computed(() =>
  Object.entries(props.counts).filter(([, v]) => v > 0),
)

const traces = computed(() => [
  {
    type: 'pie',
    hole: 0.62,
    values: entries.value.map(([, v]) => v),
    labels: entries.value.map(([t]) => ROUTE_TYPE_META[t]?.label || t),
    marker: {
      colors: entries.value.map(([t]) => COLORS[t] || '#667085'),
      line: { color: '#ffffff', width: 2 },
    },
    textinfo: 'percent',
    textfont: { size: 12, color: '#ffffff' },
    hovertemplate: '<b>%{label}</b><br>%{value} route(s)<br>%{percent}<extra></extra>',
    sort: false,
  },
])

const layout = computed(() => ({
  showlegend: true,
  legend: { orientation: 'v', x: 1.05, y: 0.5, font: { size: 11 } },
  margin: { l: 8, r: 110, t: 8, b: 8 },
}))
</script>

<template>
  <PlotlyChart :data="traces" :layout="layout" :height="height" />
</template>
