<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import Plotly from 'plotly.js-dist-min'

const props = defineProps({
  data: { type: Array, required: true },
  layout: { type: Object, default: () => ({}) },
  config: { type: Object, default: () => ({}) },
  height: { type: [String, Number], default: 320 },
})

const container = ref(null)
let resizeObserver = null

// Brand-aligned Plotly defaults applied to every chart.
const baseLayout = {
  font: {
    family: 'Inter, system-ui, sans-serif',
    size: 12,
    color: '#344054',
  },
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  margin: { l: 48, r: 16, t: 16, b: 40 },
  xaxis: {
    gridcolor: '#eef0f4',
    zerolinecolor: '#e4e7ec',
    linecolor: '#e4e7ec',
    tickfont: { size: 11, color: '#667085' },
  },
  yaxis: {
    gridcolor: '#eef0f4',
    zerolinecolor: '#e4e7ec',
    linecolor: '#e4e7ec',
    tickfont: { size: 11, color: '#667085' },
  },
  legend: {
    orientation: 'h',
    y: -0.2,
    font: { size: 11, color: '#475467' },
  },
  hoverlabel: {
    bgcolor: '#101828',
    bordercolor: '#101828',
    font: { color: '#ffffff', family: 'Inter, sans-serif', size: 12 },
  },
}

const baseConfig = {
  displayModeBar: false,
  responsive: true,
}

function mergeLayout() {
  return {
    ...baseLayout,
    ...props.layout,
    xaxis: { ...baseLayout.xaxis, ...(props.layout.xaxis || {}) },
    yaxis: { ...baseLayout.yaxis, ...(props.layout.yaxis || {}) },
    legend: { ...baseLayout.legend, ...(props.layout.legend || {}) },
    margin: { ...baseLayout.margin, ...(props.layout.margin || {}) },
  }
}

function render() {
  if (!container.value) return
  Plotly.react(
    container.value,
    props.data,
    mergeLayout(),
    { ...baseConfig, ...props.config },
  )
}

onMounted(() => {
  render()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      if (container.value) Plotly.Plots.resize(container.value)
    })
    resizeObserver.observe(container.value)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  if (container.value) Plotly.purge(container.value)
})

watch(
  () => [props.data, props.layout, props.config],
  () => render(),
  { deep: true },
)
</script>

<template>
  <div
    ref="container"
    :style="{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }"
  />
</template>
