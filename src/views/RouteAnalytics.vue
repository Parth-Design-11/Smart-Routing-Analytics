<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import EmptyState from '@/components/ui/EmptyState.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'

import VolumeTrend from '@/components/charts/VolumeTrend.vue'
import RouteFlowSankey from '@/components/charts/RouteFlowSankey.vue'
import FailureReasonsBar from '@/components/charts/FailureReasonsBar.vue'
import SmsDeliveryDistribution from '@/components/charts/SmsDeliveryDistribution.vue'

import { useFiltersStore } from '@/stores/filters'
import { getRouteById, ROUTE_TYPE_META } from '@/mock/routes'
import { generateRouteMetrics } from '@/mock/generateMetrics'
import { formatNumber, formatPercent } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const store = useFiltersStore()

const routeData = computed(() => getRouteById(route.params.id))
const metrics = computed(() =>
  routeData.value ? generateRouteMetrics(routeData.value.id, store.dateRange) : null,
)

// Aggregate per-channel totals across all time buckets.
const perChannelTotals = computed(() => {
  if (!metrics.value) return {}
  const acc = {}
  metrics.value.series.forEach((s) => {
    Object.entries(s.perChannel || {}).forEach(([ch, v]) => {
      acc[ch] = acc[ch] || { attempted: 0, delivered: 0 }
      acc[ch].attempted += v.attempted || 0
      acc[ch].delivered += v.delivered || 0
    })
  })
  return acc
})

// Channels present on this route, in priority order.
const routeChannels = computed(() => {
  if (!routeData.value) return []
  return routeData.value.priority || ROUTE_TYPE_META[routeData.value.type]?.channels || []
})

const CHANNEL_LABEL = { tc: 'TrueCaller', rcs: 'RCS', sms: 'SMS' }
const CHANNEL_ICON_PATH = {
  tc:  'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z',
  rcs: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
  sms: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z',
}

// Fallback Efficiency Ratio: primary channel delivered / total delivered × 100.
const fallbackEfficiencyRatio = computed(() => {
  if (!metrics.value || !routeData.value) return null
  const primaryCh = routeChannels.value[0]
  if (!primaryCh || routeChannels.value.length < 2) return null
  const primaryDelivered = perChannelTotals.value[primaryCh]?.delivered || 0
  const totalDelivered = metrics.value.totals.delivered || 1
  return (primaryDelivered / totalDelivered) * 100
})

const isSmsOnly = computed(() => routeData.value?.type === 'sms')

// Edge-case flags (drive banners and widget visibility).
const edgeFlags = computed(() => {
  const r = routeData.value
  const m = metrics.value
  return {
    isSmsOnly: r?.type === 'sms',
    isNewRoute: r?.edgeCase === 'new' || (m?.totals.submitted ?? 0) === 0,
    isPaused: r?.status === 'paused',
    isLowVolume: m && m.totals.submitted > 0 && m.totals.submitted < 100,
    isAllFailing: m && m.kpis.deliveryRate < 5 && m.totals.submitted > 0,
    isConfigChanged: r?.edgeCase === 'config-changed',
  }
})

/** Shown above the Sankey: primary channel success vs SMS fallback. */
const routeFlowSummary = computed(() => {
  if (!metrics.value || !routeData.value) return null
  if (edgeFlags.value.isSmsOnly) return null
  const fallbackTriggered = metrics.value.totals.fallbackTriggered || 0
  if (fallbackTriggered === 0) return { variant: 'all-primary' }
  const t = metrics.value.totals
  const submitted = t.submitted || 1
  const primaryPct = ((t.delivered - fallbackTriggered * 0.9) / submitted) * 100
  return {
    variant: 'split',
    primaryPct,
    fallbackPct: metrics.value.kpis.fallbackRate,
  }
})

// Compare-period: flag insufficient prior data.
const noPriorData = computed(
  () => store.comparePeriod && metrics.value && metrics.value.totals.submitted < 1000,
)
</script>

<template>
  <div v-if="!routeData" class="p-10 text-center text-ink-muted">
    Route not found.
    <button class="ml-2 text-brand-blue underline" @click="router.push('/routes')">
      Back to listing
    </button>
  </div>

  <div v-else class="space-y-6">
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-2">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-1.5 text-caption text-ink-muted">
          <button
            class="hover:text-ink hover:underline"
            @click="router.push('/routes')"
          >
            Smart Routes
          </button>
          <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span class="text-ink">{{ routeData.name }}</span>
        </nav>

        <!-- Title + status -->
        <div class="flex items-center gap-2">
          <h2 class="text-section-heading text-ink">{{ routeData.name }} Analytics</h2>
          <StatusPill :tone="routeData.status === 'active' ? 'success' : 'warning'">
            {{ routeData.status === 'active' ? 'Active' : 'Paused' }}
          </StatusPill>
        </div>

        <!-- Context bar -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Channels configured -->
          <div class="flex items-center gap-1 rounded-full border border-surface-border bg-surface px-3 py-1">
            <span class="mr-1 text-caption text-ink-muted">Channels:</span>
            <template v-for="(ch, idx) in routeChannels" :key="ch">
              <span class="text-caption font-medium text-ink">{{ CHANNEL_LABEL[ch] || ch }}</span>
              <svg
                v-if="idx < routeChannels.length - 1"
                class="h-3 w-3 text-ink-muted"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </template>
          </div>

          <!-- Enterprise -->
          <div class="flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-1">
            <svg class="h-3.5 w-3.5 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span class="text-caption text-ink-muted">Enterprise:</span>
            <span class="text-caption font-medium text-ink">{{ routeData.enterprise }}</span>
          </div>

          <!-- Source / SMPP -->
          <div class="flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-1">
            <svg class="h-3.5 w-3.5 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
            <span class="text-caption text-ink-muted">Source:</span>
            <span class="text-caption font-medium text-ink">{{ routeData.smppAccount || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- Date range picker -->
      <div class="flex items-center gap-3 pt-1">
        <DateRangePicker />
      </div>
    </div>

    <div class="border-t border-surface-border" aria-hidden="true" />

    <!-- ── Edge-case banners ───────────────────────────────────────────── -->
    <div
      v-if="edgeFlags.isAllFailing"
      class="flex items-start gap-3 rounded-large border border-danger/30 bg-danger-soft px-4 py-3"
    >
      <svg class="mt-0.5 h-5 w-5 text-danger-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9" /><path d="M12 8v4m0 4h.01" />
      </svg>
      <div>
        <p class="text-body font-semibold text-danger-text">Active incident · 0% delivery</p>
        <p class="text-caption text-danger-text/80">
          All channels are failing to deliver. Investigate operator connectivity and agent status immediately.
        </p>
      </div>
    </div>

    <div
      v-if="edgeFlags.isPaused"
      class="flex items-start gap-3 rounded-large border border-warning/30 bg-warning-soft px-4 py-3"
    >
      <svg class="mt-0.5 h-5 w-5 text-warning-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" />
      </svg>
      <div>
        <p class="text-body font-semibold text-warning-text">
          Route paused on {{ routeData.pausedOn || routeData.lastModified }}
        </p>
        <p class="text-caption text-warning-text/80">
          Historical data is still shown. No new traffic is being routed until you resume.
        </p>
      </div>
    </div>

    <div
      v-if="edgeFlags.isConfigChanged"
      class="flex items-start gap-3 rounded-large border border-brand-blue/30 bg-brand-blue-light px-4 py-3"
    >
      <svg class="mt-0.5 h-5 w-5 text-brand-blue-deep" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9" /><path d="M12 8v4m0 4h.01" />
      </svg>
      <div>
        <p class="text-body font-semibold text-brand-blue-deep">
          Route config changed on {{ routeData.configChangedOn }}
        </p>
        <p class="text-caption text-brand-blue-deep/80">
          Metrics before and after this date may not be directly comparable.
        </p>
      </div>
    </div>

    <div
      v-if="edgeFlags.isLowVolume"
      class="flex items-start gap-2 rounded-large border border-surface-border bg-surface-muted px-4 py-3 text-caption text-ink-subtle"
    >
      <svg class="mt-0.5 h-4 w-4 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9" /><path d="M12 8v4m0 4h.01" />
      </svg>
      Low volume ({{ formatNumber(metrics.totals.submitted) }} messages) — percentage metrics may be noisy.
    </div>

    <div
      v-if="noPriorData"
      class="flex items-start gap-2 rounded-large border border-surface-border bg-surface-muted px-4 py-3 text-caption text-ink-subtle"
    >
      <svg class="mt-0.5 h-4 w-4 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9" /><path d="M12 8v4m0 4h.01" />
      </svg>
      No prior-period data for comparison — deltas are hidden.
    </div>

    <!-- Empty state for new/no-traffic routes -->
    <div v-if="edgeFlags.isNewRoute" class="card p-6">
      <EmptyState
        title="No messages routed yet"
        description="Traffic will appear here within a few minutes of your first send."
      />
    </div>

    <template v-else>
      <!-- ── Section A: Summary Count Tiles ──────────────────────────── -->
      <div>
        <h3 class="mb-3 text-sub-heading text-ink">Performance Summary</h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            label="Total Submitted"
            :value="formatNumber(metrics.totals.submitted)"
            :delta="noPriorData ? null : metrics.kpis.volumeDelta"
          />
          <KpiCard
            label="Delivered"
            :value="formatNumber(metrics.totals.delivered)"
            :sub-value="formatPercent(metrics.totals.submitted ? (metrics.totals.delivered / metrics.totals.submitted) * 100 : 0) + ' of submitted'"
            :delta="noPriorData ? null : metrics.kpis.deliveryDelta"
          />
          <KpiCard
            label="Failed"
            :value="formatNumber(metrics.totals.failed)"
            :sub-value="formatPercent(metrics.totals.submitted ? (metrics.totals.failed / metrics.totals.submitted) * 100 : 0) + ' of submitted'"
            :delta="null"
          />
        </div>
      </div>

      <!-- ── Section B: Channel Delivery & Efficiency ─────────────────── -->
      <div>
        <h3 class="mb-3 text-sub-heading text-ink">Channel Delivery &amp; Efficiency</h3>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <!-- Total Submitted to SMS Inbound -->
          <div class="card p-4">
            <p class="text-caption text-ink-muted">Total Submitted (Inbound)</p>
            <p class="mt-1 text-display-md text-ink">{{ formatNumber(metrics.totals.submitted) }}</p>
            <p class="mt-0.5 text-caption text-ink-subtle">Gross messages entering routing</p>
          </div>

          <!-- Per-channel delivered tiles -->
          <template v-for="ch in routeChannels.filter(c => c !== 'sms' || isSmsOnly)" :key="ch">
            <div v-if="perChannelTotals[ch]" class="card p-4">
              <p class="text-caption text-ink-muted">Delivered on {{ CHANNEL_LABEL[ch] || ch }}</p>
              <p class="mt-1 text-display-md text-ink">{{ formatNumber(perChannelTotals[ch]?.delivered || 0) }}</p>
              <p class="mt-0.5 text-caption text-ink-subtle">
                {{ formatPercent(metrics.totals.delivered ? (perChannelTotals[ch]?.delivered || 0) / metrics.totals.delivered * 100 : 0) }} of delivered
              </p>
            </div>
          </template>

          <!-- SMS delivered (always shown if not already captured above) -->
          <div v-if="!isSmsOnly && perChannelTotals.sms" class="card p-4">
            <p class="text-caption text-ink-muted">Delivered on SMS</p>
            <p class="mt-1 text-display-md text-ink">{{ formatNumber(perChannelTotals.sms?.delivered || 0) }}</p>
            <p class="mt-0.5 text-caption text-ink-subtle">
              {{ formatPercent(metrics.totals.delivered ? (perChannelTotals.sms?.delivered || 0) / metrics.totals.delivered * 100 : 0) }} of delivered
            </p>
          </div>

          <!-- Fallback Efficiency Ratio (multi-channel only) -->
          <div v-if="fallbackEfficiencyRatio !== null" class="card p-4">
            <p class="text-caption text-ink-muted">Fallback Efficiency Ratio</p>
            <p class="mt-1 text-display-md text-ink">{{ formatPercent(fallbackEfficiencyRatio) }}</p>
            <p class="mt-0.5 text-caption text-ink-subtle">
              Delivered on {{ CHANNEL_LABEL[routeChannels[0]] || routeChannels[0] }} (primary)
            </p>
          </div>
        </div>
      </div>

      <!-- ── Chart A: Route Flow Sankey ───────────────────────────────── -->
      <div class="card p-4">
        <div class="mb-2">
          <h3 class="text-sub-heading text-ink">Route Flow</h3>
          <p class="text-caption text-ink-muted">
            End-to-end message flow across configured channels and failure reasons
          </p>
        </div>
        <RouteFlowSankey
          :route="routeData"
          :totals="metrics.totals"
          :per-channel-totals="perChannelTotals"
          :reasons="metrics.reasonTotals"
          :flow-summary="routeFlowSummary"
        />
      </div>

      <!-- ── Chart D: Trend Graph + Chart B: Failure Pies ─────────────── -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="card p-4 lg:col-span-2">
          <h3 class="mb-1 text-sub-heading text-ink">Trend</h3>
          <p class="mb-3 text-caption text-ink-muted">
            Message volume over time — Submitted, Delivered, Failed
          </p>
          <VolumeTrend :series="metrics.series" :height="300" />
        </div>
        <div class="card p-4">
          <h3 class="mb-1 text-sub-heading text-ink">Failure Reasons</h3>
          <p class="mb-3 text-caption text-ink-muted">
            Breakdown by channel of why messages failed
          </p>
          <FailureReasonsBar
            :channel-failure-reasons="metrics.channelFailureReasons"
            :channels="routeChannels"
            :height="300"
          />
        </div>
      </div>

      <!-- ── Chart C: SMS Delivery Distribution ───────────────────────── -->
      <div class="card p-4">
        <div class="mb-2">
          <h3 class="text-sub-heading text-ink">SMS Delivery Distribution</h3>
          <p class="text-caption text-ink-muted">
            Delivered messages across telecom operators — click a bar to drill down into connects
          </p>
        </div>
        <SmsDeliveryDistribution
          :operator-totals="metrics.operatorTotals"
          :connect-totals="metrics.connectTotals"
        />
      </div>
    </template>
  </div>
</template>
