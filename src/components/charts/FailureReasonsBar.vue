<script setup>
import { computed } from 'vue'
import PlotlyChart from './PlotlyChart.vue'
import { adjustOpacity, PRIMARY_COLOR, monochromeScale } from '@/utils/chartColors'

/**
 * Renders per-channel failure reason pie charts side by side.
 * Props:
 *   channelFailureReasons: { tc: [...], rcs: [...], sms: [...] }
 *   channels: string[]  — ordered list of channels present on this route
 */
const props = defineProps({
  channelFailureReasons: { type: Object, required: true },
  channels: { type: Array, required: true },
  height: { type: [String, Number], default: 280 },
})

const CHANNEL_LABEL = { tc: 'TrueCaller', rcs: 'RCS', sms: 'SMS' }

const PIE_COLORS = [
  PRIMARY_COLOR,
  monochromeScale[1],
  monochromeScale[2],
  monochromeScale[3],
  monochromeScale[4],
  monochromeScale[5],
  adjustOpacity(PRIMARY_COLOR, 0.25),
  adjustOpacity(PRIMARY_COLOR, 0.15),
]

const activeChannels = computed(() =>
  props.channels.filter((ch) => {
    const reasons = props.channelFailureReasons[ch] || []
    return reasons.some((r) => r.count > 0)
  }),
)

const traces = computed(() => {
  const n = activeChannels.value.length
  if (n === 0) return []

  // Determine grid columns: each pie gets an equal horizontal slice.
  const domainWidth = 1 / n
  const gap = 0.04

  return activeChannels.value.map((ch, i) => {
    const reasons = (props.channelFailureReasons[ch] || []).filter((r) => r.count > 0)
    const xStart = i * domainWidth + gap / 2
    const xEnd = (i + 1) * domainWidth - gap / 2

    return {
      type: 'pie',
      labels: reasons.map((r) => r.label),
      values: reasons.map((r) => r.count),
      name: CHANNEL_LABEL[ch] || ch,
      domain: { x: [xStart, xEnd], y: [0.12, 1] },
      marker: { colors: PIE_COLORS },
      textinfo: 'percent',
      textposition: 'inside',
      insidetextorientation: 'radial',
      hole: 0.3,
      customdata: reasons.map((r) => {
        const total = reasons.reduce((a, x) => a + x.count, 0) || 1
        return ((r.count / total) * 100).toFixed(1)
      }),
      hovertemplate: '<b>%{label}</b><br>%{value:,.0f} messages (%{customdata}%)<extra>' + (CHANNEL_LABEL[ch] || ch) + '</extra>',
    }
  })
})

// One annotation per pie: channel name centered beneath it.
const annotations = computed(() => {
  const n = activeChannels.value.length
  if (n === 0) return []
  const domainWidth = 1 / n
  return activeChannels.value.map((ch, i) => ({
    text: `<b>${CHANNEL_LABEL[ch] || ch}</b>`,
    x: (i + 0.5) * domainWidth,
    y: 0.06,
    xanchor: 'center',
    yanchor: 'top',
    showarrow: false,
    font: { size: 12, color: '#344054' },
  }))
})

const layout = computed(() => ({
  showlegend: true,
  legend: { orientation: 'h', y: -0.08, x: 0.5, xanchor: 'center' },
  annotations: annotations.value,
  margin: { l: 4, r: 4, t: 8, b: 8 },
}))
</script>

<template>
  <div>
    <div v-if="activeChannels.length === 0" class="py-8 text-center text-caption text-ink-muted">
      No failure data available.
    </div>
    <PlotlyChart v-else :data="traces" :layout="layout" :height="height" />
  </div>
</template>
