<script setup>
import { computed } from 'vue'
import PlotlyChart from './PlotlyChart.vue'

const props = defineProps({
  senders: { type: Array, required: true }, // string[]
  templates: { type: Array, required: true }, // [{ id, name, active }]
  matrix: { type: Array, required: true }, // [{ sender, cells: { [tid]: { rate, volume, active } } }]
  height: { type: [String, Number], default: 300 },
})

const z = computed(() =>
  props.matrix.map((row) => props.templates.map((t) => row.cells[t.id]?.rate ?? null)),
)

const annotations = computed(() => {
  const out = []
  props.matrix.forEach((row) => {
    props.templates.forEach((t) => {
      const c = row.cells[t.id]
      if (!c) return
      out.push({
        x: t.name,
        y: row.sender,
        text: c.active ? `${c.rate.toFixed(0)}%` : '✕',
        showarrow: false,
        font: {
          color: c.rate > 55 ? '#ffffff' : '#101828',
          size: 11,
          family: 'Inter',
        },
      })
    })
  })
  return out
})

const traces = computed(() => [
  {
    type: 'heatmap',
    z: z.value,
    x: props.templates.map((t) => t.name),
    y: props.matrix.map((r) => r.sender),
    colorscale: [
      [0, '#EEF2FF'],
      [0.4, '#ADC5FE'],
      [0.7, '#5E7BFC'],
      [1, '#1A3497'],
    ],
    zmin: 0,
    zmax: 100,
    showscale: true,
    colorbar: { thickness: 8, len: 0.8, ticksuffix: '%', outlinewidth: 0 },
    xgap: 2,
    ygap: 2,
    hovertemplate: '<b>%{y} × %{x}</b><br>Delivery: %{z:.1f}%<extra></extra>',
  },
])

const layout = computed(() => ({
  margin: { l: 90, r: 60, t: 8, b: 40 },
  xaxis: { side: 'bottom', tickangle: -15 },
  yaxis: { automargin: true },
  annotations: annotations.value,
}))
</script>

<template>
  <PlotlyChart :data="traces" :layout="layout" :height="height" />
</template>
