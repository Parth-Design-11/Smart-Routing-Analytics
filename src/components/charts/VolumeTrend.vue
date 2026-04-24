<script setup>
import { computed } from 'vue'
import PlotlyChart from './PlotlyChart.vue'

const props = defineProps({
  series: { type: Array, required: true }, // [{ ts, perChannel: { sms, rcs, tc } }]
  height: { type: [String, Number], default: 280 },
})

const CHANNEL_META = {
  rcs: { label: 'RCS', color: '#7839ee' },
  tc: { label: 'TrueCaller', color: '#12b76a' },
  sms: { label: 'SMS', color: '#1570ef' },
}

const activeChannels = computed(() => {
  const set = new Set()
  props.series.forEach((s) =>
    Object.keys(s.perChannel || {}).forEach((ch) => set.add(ch)),
  )
  return Array.from(set)
})

const traces = computed(() => {
  const x = props.series.map((s) => s.ts)
  return activeChannels.value.map((ch) => ({
    x,
    y: props.series.map((s) => (s.perChannel[ch]?.attempted) || 0),
    name: CHANNEL_META[ch]?.label || ch,
    type: 'scatter',
    mode: 'lines',
    stackgroup: 'one',
    line: { width: 0.5, color: CHANNEL_META[ch]?.color },
    fillcolor: (CHANNEL_META[ch]?.color || '#1570ef') + 'cc',
    hovertemplate: `<b>%{x|%d %b}</b><br>${CHANNEL_META[ch]?.label || ch}: %{y:,.0f}<extra></extra>`,
  }))
})

const layout = computed(() => ({
  showlegend: true,
  xaxis: { type: 'date', tickformat: '%d %b' },
  yaxis: { tickformat: ',d', title: { text: '' } },
}))
</script>

<template>
  <PlotlyChart :data="traces" :layout="layout" :height="height" />
</template>
