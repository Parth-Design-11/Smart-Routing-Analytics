<script setup>
import { computed } from 'vue'
import PlotlyChart from './PlotlyChart.vue'

// Multi-channel only. Shows what share of final-delivered messages landed
// at each priority step (priority 1 → priority 2 → SMS fallback).
const props = defineProps({
  route: { type: Object, required: true },
  perChannelTotals: { type: Object, required: true },
  height: { type: [String, Number], default: 200 },
})

const CHANNEL_COLOR = { sms: '#375DFB', rcs: '#85A0FD', tc: '#ADC5FE' }
const CHANNEL_LABEL = { sms: 'SMS', rcs: 'RCS', tc: 'TrueCaller' }

const stages = computed(() => {
  const priority = props.route.priority || (props.route.channels || [])
  return priority.map((ch, i) => {
    const c = props.perChannelTotals[ch] || { delivered: 0 }
    return {
      label: i === 0 ? `P1 · ${CHANNEL_LABEL[ch]}` : i === priority.length - 1 ? `Fallback · ${CHANNEL_LABEL[ch]}` : `P${i + 1} · ${CHANNEL_LABEL[ch]}`,
      value: c.delivered || 0,
      color: CHANNEL_COLOR[ch] || '#667085',
    }
  })
})

const total = computed(() => stages.value.reduce((a, s) => a + s.value, 0) || 1)

const traces = computed(() =>
  stages.value.map((s) => ({
    type: 'bar',
    orientation: 'h',
    x: [(s.value / total.value) * 100],
    y: ['Delivery by priority'],
    name: s.label,
    marker: { color: s.color },
    hovertemplate: `<b>${s.label}</b><br>%{x:.1f}% (${s.value.toLocaleString()} msgs)<extra></extra>`,
    text: [`${((s.value / total.value) * 100).toFixed(0)}%`],
    textposition: 'inside',
    textfont: { color: '#ffffff', size: 11 },
  })),
)

const layout = computed(() => ({
  barmode: 'stack',
  showlegend: true,
  legend: { orientation: 'h', y: -0.8, font: { size: 11 } },
  margin: { l: 120, r: 16, t: 8, b: 8 },
  xaxis: { range: [0, 100], ticksuffix: '%', showgrid: false },
  yaxis: { showgrid: false, automargin: true },
}))
</script>

<template>
  <PlotlyChart :data="traces" :layout="layout" :height="height" />
</template>
