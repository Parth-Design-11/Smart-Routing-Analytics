<script setup>
import { computed } from 'vue'
import PlotlyChart from './PlotlyChart.vue'
import { channelColors, monochromeScale, PRIMARY_COLOR } from '@/utils/chartColors'

const props = defineProps({
  channel: { type: String, required: true }, // 'tc' | 'rcs' | 'sms'
  reasons: { type: Array, required: true },  // [{ key, label, count }]
})

const CHANNEL_COLORS = {
  tc: channelColors.tc,
  rcs: channelColors.rcs,
  sms: channelColors.sms,
}

const plotData = computed(() => {
  // Take top 5 reasons, collapse the rest into "Other".
  const sorted = [...props.reasons].sort((a, b) => b.count - a.count)
  const top = sorted.slice(0, 5)
  const rest = sorted.slice(5)
  const otherCount = rest.reduce((s, r) => s + r.count, 0)

  const slices = otherCount > 0 ? [...top, { key: 'other-agg', label: 'Other', count: otherCount }] : top
  const primary = CHANNEL_COLORS[props.channel] || PRIMARY_COLOR

  // Generate color palette: primary for largest slice, muted variants for rest.
  const colors = slices.map((_, i) =>
    i === 0 ? primary : monochromeScale[(i + 1) % monochromeScale.length],
  )

  return [{
    type: 'pie',
    labels: slices.map((r) => r.label),
    values: slices.map((r) => r.count),
    hole: 0.4,
    textinfo: 'percent',
    hoverinfo: 'label+percent+value',
    marker: { colors },
    textfont: { size: 11 },
  }]
})

const layout = {
  showlegend: true,
  legend: { orientation: 'v', x: 1, y: 0.5, font: { size: 10 } },
  margin: { t: 8, r: 100, b: 8, l: 8 },
}
</script>

<template>
  <PlotlyChart :data="plotData" :layout="layout" height="220px" />
</template>
