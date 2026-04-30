<script setup>
import { computed, ref } from 'vue'
import PlotlyChart from './PlotlyChart.vue'
import { adjustOpacity, channelColors, PRIMARY_COLOR } from '@/utils/chartColors'

const props = defineProps({
  series: { type: Array, required: true }, // [{ ts, submitted, delivered, failed, perChannel }]
  height: { type: [String, Number], default: 300 },
})

const CHANNEL_META = {
  tc:  { label: 'TC Delivered',  color: channelColors.tc },
  rcs: { label: 'RCS Delivered', color: channelColors.rcs },
  sms: { label: 'SMS Delivered', color: channelColors.sms },
}

// Which channel overlays are toggled on.
const activeChannels = ref([])

const availableChannels = computed(() => {
  const set = new Set()
  props.series.forEach((s) => Object.keys(s.perChannel || {}).forEach((ch) => set.add(ch)))
  return Array.from(set)
})

function toggleChannel(ch) {
  if (activeChannels.value.includes(ch)) {
    activeChannels.value = activeChannels.value.filter((c) => c !== ch)
  } else {
    activeChannels.value = [...activeChannels.value, ch]
  }
}

const traces = computed(() => {
  const x = props.series.map((s) => s.ts)
  const submitted = props.series.map((s) => s.submitted || 0)
  const base = [
    {
      x,
      y: submitted,
      name: 'Submitted',
      type: 'scatter',
      mode: 'lines',
      line: { width: 2, color: PRIMARY_COLOR, dash: 'dot' },
      hovertemplate: '<b>%{x|%d %b}</b><br>Submitted: %{y:,.0f}<extra></extra>',
    },
    {
      x,
      y: props.series.map((s) => s.delivered || 0),
      name: 'Delivered',
      type: 'scatter',
      mode: 'lines',
      fill: 'tozeroy',
      line: { width: 1.5, color: PRIMARY_COLOR },
      fillcolor: adjustOpacity(PRIMARY_COLOR, 0.18),
      customdata: props.series.map((s) => {
        const sub = s.submitted || 1
        return ((s.delivered || 0) / sub * 100).toFixed(1)
      }),
      hovertemplate: '<b>%{x|%d %b}</b><br>Delivered: %{y:,.0f} (%{customdata}%)<extra></extra>',
    },
    {
      x,
      y: props.series.map((s) => s.failed || 0),
      name: 'Failed',
      type: 'scatter',
      mode: 'lines',
      fill: 'tozeroy',
      line: { width: 1.5, color: adjustOpacity(PRIMARY_COLOR, 0.45) },
      fillcolor: adjustOpacity(PRIMARY_COLOR, 0.08),
      customdata: props.series.map((s) => {
        const sub = s.submitted || 1
        return ((s.failed || 0) / sub * 100).toFixed(1)
      }),
      hovertemplate: '<b>%{x|%d %b}</b><br>Failed: %{y:,.0f} (%{customdata}%)<extra></extra>',
    },
  ]

  // Optional per-channel delivered overlays.
  const channelLines = activeChannels.value.map((ch) => {
    const meta = CHANNEL_META[ch] || { label: ch, color: PRIMARY_COLOR }
    return {
      x,
      y: props.series.map((s) => s.perChannel?.[ch]?.delivered || 0),
      name: meta.label,
      type: 'scatter',
      mode: 'lines',
      line: { width: 2, color: meta.color, dash: 'dash' },
      hovertemplate: `<b>%{x|%d %b}</b><br>${meta.label}: %{y:,.0f}<extra></extra>`,
    }
  })

  return [...base, ...channelLines]
})

const layout = computed(() => ({
  showlegend: true,
  legend: { orientation: 'h', y: -0.18, x: 0 },
  xaxis: { type: 'date', tickformat: '%d %b' },
  yaxis: { tickformat: ',d' },
  margin: { l: 44, r: 12, t: 8, b: 32 },
  hovermode: 'x unified',
}))
</script>

<template>
  <div class="space-y-3">
    <!-- Channel overlay toggles -->
    <div v-if="availableChannels.length > 1" class="flex flex-wrap items-center gap-2">
      <span class="text-caption text-ink-muted">Show channel:</span>
      <button
        v-for="ch in availableChannels"
        :key="ch"
        @click="toggleChannel(ch)"
        :class="[
          'rounded-full border px-2.5 py-0.5 text-caption transition-colors',
          activeChannels.includes(ch)
            ? 'border-brand-blue bg-brand-blue text-white'
            : 'border-surface-border bg-surface text-ink-muted hover:border-brand-blue hover:text-ink',
        ]"
      >
        {{ CHANNEL_META[ch]?.label || ch }}
      </button>
    </div>
    <PlotlyChart :data="traces" :layout="layout" :height="height" />
  </div>
</template>
