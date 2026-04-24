<script setup>
import { computed } from 'vue'
import PlotlyChart from './PlotlyChart.vue'

const props = defineProps({
  series: { type: Array, required: true },
  height: { type: [String, Number], default: 280 },
})

const CHANNEL_META = {
  rcs: { label: 'RCS', color: '#85A0FD' },
  tc: { label: 'TrueCaller', color: '#ADC5FE' },
  sms: { label: 'SMS', color: '#375DFB' },
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
    y: props.series.map((s) => {
      const v = s.perChannel[ch]
      if (!v || !v.attempted) return null
      return (v.delivered / v.attempted) * 100
    }),
    name: CHANNEL_META[ch]?.label || ch,
    type: 'scatter',
    mode: 'lines',
    line: { width: 2.5, color: CHANNEL_META[ch]?.color, shape: 'spline', smoothing: 0.6 },
    hovertemplate: `<b>%{x|%d %b}</b><br>${CHANNEL_META[ch]?.label || ch} delivery: %{y:.1f}%<extra></extra>`,
    connectgaps: false,
  }))
})

const layout = computed(() => ({
  showlegend: true,
  xaxis: { type: 'date', tickformat: '%d %b' },
  yaxis: { ticksuffix: '%', range: [0, 100] },
}))
</script>

<template>
  <PlotlyChart :data="traces" :layout="layout" :height="height" />
</template>
