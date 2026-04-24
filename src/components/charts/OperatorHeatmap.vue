<script setup>
import { computed } from 'vue'
import PlotlyChart from './PlotlyChart.vue'

const props = defineProps({
  matrix: { type: Array, required: true }, // [{ operator, key, sms, rcs, tc }]
  channels: { type: Array, default: () => ['sms', 'rcs', 'tc'] },
  height: { type: [String, Number], default: 280 },
})

const CHANNEL_LABELS = { sms: 'SMS', rcs: 'RCS', tc: 'TrueCaller' }

const z = computed(() =>
  props.matrix.map((row) => props.channels.map((ch) => (row[ch] == null ? null : row[ch]))),
)

const annotations = computed(() => {
  const out = []
  props.matrix.forEach((row, ri) => {
    props.channels.forEach((ch, ci) => {
      const v = row[ch]
      if (v == null) return
      out.push({
        x: CHANNEL_LABELS[ch] || ch,
        y: row.operator,
        text: `${v.toFixed(1)}%`,
        showarrow: false,
        font: { color: v > 55 ? '#ffffff' : '#101828', size: 11, family: 'Inter' },
      })
    })
  })
  return out
})

const traces = computed(() => [
  {
    type: 'heatmap',
    z: z.value,
    x: props.channels.map((ch) => CHANNEL_LABELS[ch] || ch),
    y: props.matrix.map((r) => r.operator),
    colorscale: [
      [0, '#fee4e2'],
      [0.4, '#fec84b'],
      [0.7, '#7ee2b8'],
      [1, '#108c3d'],
    ],
    zmin: 0,
    zmax: 100,
    showscale: true,
    colorbar: {
      thickness: 8,
      len: 0.8,
      tickfont: { size: 10 },
      ticksuffix: '%',
      outlinewidth: 0,
    },
    hovertemplate: '<b>%{y} · %{x}</b><br>Delivery: %{z:.1f}%<extra></extra>',
    xgap: 2,
    ygap: 2,
  },
])

const layout = computed(() => ({
  margin: { l: 64, r: 56, t: 8, b: 28 },
  xaxis: { side: 'bottom' },
  yaxis: { automargin: true },
  annotations: annotations.value,
}))
</script>

<template>
  <PlotlyChart :data="traces" :layout="layout" :height="height" />
</template>
