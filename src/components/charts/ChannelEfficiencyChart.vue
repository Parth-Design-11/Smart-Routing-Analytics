<script setup>
import { computed } from 'vue'
import PlotlyChart from './PlotlyChart.vue'
import { adjustOpacity, channelColors, PRIMARY_COLOR } from '@/utils/chartColors'

const props = defineProps({
  channel: { type: String, required: true }, // 'tc' | 'rcs' | 'sms'
  data: { type: Object, required: true },    // { attempted, delivered, failed }
})

const CHANNEL_META = {
  tc: { label: 'TrueCaller', color: channelColors.tc },
  rcs: { label: 'RCS', color: channelColors.rcs },
  sms: { label: 'SMS', color: channelColors.sms },
}

const meta = computed(() => CHANNEL_META[props.channel] || { label: props.channel, color: PRIMARY_COLOR })

const plotData = computed(() => [
  {
    type: 'bar',
    name: 'Attempted',
    x: [meta.value.label],
    y: [props.data.attempted],
    marker: { color: adjustOpacity(PRIMARY_COLOR, 0.3) },
  },
  {
    type: 'bar',
    name: 'Delivered',
    x: [meta.value.label],
    y: [props.data.delivered],
    marker: { color: PRIMARY_COLOR },
  },
  {
    type: 'bar',
    name: 'Failed',
    x: [meta.value.label],
    y: [props.data.failed],
    marker: { color: adjustOpacity(PRIMARY_COLOR, 0.55) },
  },
])

const layout = computed(() => ({
  barmode: 'group',
  showlegend: true,
  legend: { orientation: 'h', y: -0.2, x: 0.5, xanchor: 'center' },
  margin: { t: 8, r: 8, b: 48, l: 48 },
  xaxis: { showticklabels: false, showgrid: false, zeroline: false },
  yaxis: { showgrid: true, zeroline: false },
}))
</script>

<template>
  <PlotlyChart :data="plotData" :layout="layout" height="220px" />
</template>
