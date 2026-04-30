<script setup>
import { computed } from 'vue'
import PlotlyChart from './PlotlyChart.vue'

const props = defineProps({
  channel: { type: String, required: true }, // 'tc' | 'rcs' | 'sms'
  data: { type: Object, required: true },    // { attempted, delivered, failed }
})

const CHANNEL_META = {
  tc:  { label: 'TrueCaller', color: '#12b76a' },
  rcs: { label: 'RCS',        color: '#7839ee' },
  sms: { label: 'SMS',        color: '#1570ef' },
}

const meta = computed(() => CHANNEL_META[props.channel] || { label: props.channel, color: '#667085' })

const plotData = computed(() => [
  {
    type: 'bar',
    name: 'Attempted',
    x: [meta.value.label],
    y: [props.data.attempted],
    marker: { color: meta.value.color, opacity: 0.35 },
  },
  {
    type: 'bar',
    name: 'Delivered',
    x: [meta.value.label],
    y: [props.data.delivered],
    marker: { color: '#15be53' },
  },
  {
    type: 'bar',
    name: 'Failed',
    x: [meta.value.label],
    y: [props.data.failed],
    marker: { color: '#d92d20' },
  },
])

const layout = computed(() => ({
  barmode: 'group',
  showlegend: true,
  legend: { orientation: 'h', y: -0.2, x: 0.5, xanchor: 'center' },
  margin: { t: 8, r: 8, b: 48, l: 48 },
  xaxis: { showticklabels: false, showgrid: false, zeroline: false },
  yaxis: { showgrid: true, gridcolor: '#e5e7eb', zeroline: false },
}))
</script>

<template>
  <PlotlyChart :data="plotData" :layout="layout" height="220px" />
</template>
