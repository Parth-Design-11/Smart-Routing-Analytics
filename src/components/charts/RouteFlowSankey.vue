<script setup>
import { computed } from 'vue'
import PlotlyChart from './PlotlyChart.vue'
import { ROUTE_TYPE_META } from '@/mock/routes'
import { formatPercent } from '@/utils/format'

// Hero viz. Builds a Sankey end-to-end for a single route.
// Node layout is adaptive to route type.
const props = defineProps({
  route: { type: Object, required: true },
  totals: { type: Object, required: true }, // overall totals for the route
  perChannelTotals: { type: Object, required: true }, // { sms: { attempted, delivered }, ... }
  reasons: { type: Array, required: true }, // [{ label, count }]
  height: { type: [String, Number], default: 440 },
  /** Primary vs SMS fallback headline; null hides the band (e.g. SMS-only routes). */
  flowSummary: {
    type: Object,
    default: null,
  },
})

const CHANNEL_LABEL = { sms: 'SMS', rcs: 'RCS', tc: 'TrueCaller' }
const CHANNEL_COLOR = { sms: '#1570ef', rcs: '#7839ee', tc: '#12b76a' }

const sankey = computed(() => {
  const labels = []
  const colors = []
  const xs = []
  const ys = []
  const sources = []
  const targets = []
  const values = []
  const linkColors = []

  function addNode(label, color, x, y) {
    labels.push(label)
    colors.push(color)
    xs.push(x)
    ys.push(y)
    return labels.length - 1
  }

  const channels = ROUTE_TYPE_META[props.route.type].channels
  // Priority order defines the cascade: primary first, then each fallback.
  const priority = (props.route.priority || channels).filter((c) => channels.includes(c))

  // Lay out horizontally:
  //   Submitted (x≈0) → channels staggered across the middle → Delivered/Failed → reasons
  // Staggering keeps the fallback link from overlapping the primary's
  // "Delivered" branch in the same column.
  const nChannels = priority.length
  const channelStart = 0.12
  const channelEnd = 0.62
  const channelStep = nChannels > 1 ? (channelEnd - channelStart) / (nChannels - 1) : 0
  const xSubmitted = 0.01
  const xOutcome = 0.82
  const xReason = 0.999

  const submittedIdx = addNode('Submitted', '#1c73e8', xSubmitted, 0.5)
  // Delivered sits above, Failed below, so their links separate visually.
  const deliveredIdx = addNode('Delivered', '#108c3d', xOutcome, 0.15)
  const failedIdx = addNode('Failed', '#912018', xOutcome, 0.82)

  const channelNodeIdx = {}
  priority.forEach((ch, i) => {
    const x = nChannels > 1 ? channelStart + i * channelStep : 0.4
    // Each subsequent fallback drops slightly lower so the cascade reads
    // left-to-right and top-to-bottom.
    const y = 0.48 + i * 0.06
    channelNodeIdx[ch] = addNode(
      CHANNEL_LABEL[ch] || ch,
      CHANNEL_COLOR[ch] || '#667085',
      x,
      Math.min(y, 0.72),
    )
  })

  // Cascading flow:
  //   Submitted → primary channel (100%)
  //   each channel → Delivered (what it delivered)
  //                → next fallback channel (what it couldn't deliver)
  //   last channel's remainder → Failed → reasons
  let remaining = props.totals.submitted || 0
  let prevNodeIdx = submittedIdx
  let terminalFailed = 0

  priority.forEach((ch, i) => {
    if (remaining <= 0) return
    const channelIdx = channelNodeIdx[ch]
    const c = props.perChannelTotals[ch] || {}
    const delivered = Math.min(c.delivered || 0, remaining)
    const leftover = Math.max(remaining - delivered, 0)
    const isLast = i === priority.length - 1

    // prev → this channel (all remaining messages attempted here)
    sources.push(prevNodeIdx)
    targets.push(channelIdx)
    values.push(remaining)
    linkColors.push((CHANNEL_COLOR[ch] || '#667085') + '44')

    // channel → Delivered
    if (delivered > 0) {
      sources.push(channelIdx)
      targets.push(deliveredIdx)
      values.push(delivered)
      linkColors.push('#10893d44')
    }

    // channel → Failed (only for the last channel; earlier failures cascade)
    if (isLast && leftover > 0) {
      sources.push(channelIdx)
      targets.push(failedIdx)
      values.push(leftover)
      linkColors.push('#d92d2044')
      terminalFailed = leftover
    }

    prevNodeIdx = channelIdx
    remaining = leftover
  })

  // Link: Failed → reason buckets (top 5). Scale to the cascade's terminal
  // failed total so the Failed node's inflow matches its outflow.
  const topReasons = props.reasons.filter((r) => r.count > 0).slice(0, 5)
  const reasonSum = topReasons.reduce((a, r) => a + r.count, 0) || 1
  const reasonBaseY = 0.7
  const reasonStep = 0.08
  topReasons.forEach((r, i) => {
    const scaled = Math.round((r.count / reasonSum) * terminalFailed)
    if (scaled <= 0) return
    const idx = addNode(r.label, '#b42318', xReason, Math.min(0.98, reasonBaseY + i * reasonStep))
    sources.push(failedIdx)
    targets.push(idx)
    values.push(scaled)
    linkColors.push('#b4231844')
  })

  return { labels, colors, xs, ys, sources, targets, values, linkColors }
})

const traces = computed(() => [
  {
    type: 'sankey',
    orientation: 'h',
    arrangement: 'snap',
    node: {
      label: sankey.value.labels,
      color: sankey.value.colors,
      x: sankey.value.xs,
      y: sankey.value.ys,
      pad: 18,
      thickness: 18,
      line: { color: '#ffffff', width: 1 },
      hovertemplate: '<b>%{label}</b><br>Volume: %{value:,.0f}<extra></extra>',
    },
    link: {
      source: sankey.value.sources,
      target: sankey.value.targets,
      value: sankey.value.values,
      color: sankey.value.linkColors,
      hovertemplate: '<b>%{source.label} → %{target.label}</b><br>%{value:,.0f}<extra></extra>',
    },
  },
])

const layout = computed(() => ({
  font: { family: 'Inter, sans-serif', size: 11, color: '#344054' },
  margin: { l: 8, r: 8, t: 8, b: 8 },
}))
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="flowSummary"
      class="rounded-lg border border-surface-border bg-surface-muted/50 px-4 py-3 text-center sm:text-left"
    >
      <div v-if="flowSummary.variant === 'all-primary'" class="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success-text"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div>
          <p class="text-body font-semibold text-ink">100% delivered on primary</p>
          <p class="text-caption text-ink-muted">
            No messages needed to fall back to SMS in this period.
          </p>
        </div>
      </div>
      <div v-else-if="flowSummary.variant === 'split'">
        <p class="text-caption text-ink-muted">Primary delivery rate</p>
        <p class="text-display-lg text-ink">{{ formatPercent(flowSummary.primaryPct) }}</p>
        <p class="text-caption text-ink-muted">
          {{ formatPercent(flowSummary.fallbackPct) }} fell back to SMS
        </p>
      </div>
    </div>
    <PlotlyChart :data="traces" :layout="layout" :height="height" />
  </div>
</template>
