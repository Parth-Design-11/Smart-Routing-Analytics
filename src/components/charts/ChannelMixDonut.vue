<script setup>
import { computed } from 'vue'
import PlotlyChart from './PlotlyChart.vue'

const props = defineProps({
  series: { type: Array, required: true },
  height: { type: [String, Number], default: 260 },
})

const CHANNEL_META = {
  rcs: { label: 'RCS', color: '#85A0FD' },
  tc: { label: 'TrueCaller', color: '#ADC5FE' },
  sms: { label: 'SMS', color: '#375DFB' },
}

const totals = computed(() => {
  const acc = {}
  props.series.forEach((s) => {
    Object.entries(s.perChannel || {}).forEach(([ch, v]) => {
      acc[ch] = (acc[ch] || 0) + (v.attempted || 0)
    })
  })
  return acc
})

const entries = computed(() =>
  Object.entries(totals.value).filter(([, v]) => v > 0),
)

const traces = computed(() => [
  {
    type: 'pie',
    hole: 0.62,
    values: entries.value.map(([, v]) => v),
    labels: entries.value.map(([ch]) => CHANNEL_META[ch]?.label || ch.toUpperCase()),
    marker: {
      colors: entries.value.map(([ch]) => CHANNEL_META[ch]?.color || '#667085'),
      line: { color: '#ffffff', width: 2 },
    },
    textinfo: 'percent',
    textfont: { size: 12, color: '#ffffff' },
    hovertemplate: '<b>%{label}</b><br>%{value:,.0f} attempts<br>%{percent}<extra></extra>',
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
