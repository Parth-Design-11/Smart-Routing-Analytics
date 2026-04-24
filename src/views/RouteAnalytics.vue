<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PageHeader from '@/components/layout/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'

import VolumeTrend from '@/components/charts/VolumeTrend.vue'
import DeliveryFunnel from '@/components/charts/DeliveryFunnel.vue'
import RouteFlowSankey from '@/components/charts/RouteFlowSankey.vue'
import PriorityPerformance from '@/components/charts/PriorityPerformance.vue'
import OperatorSplitDonut from '@/components/charts/OperatorSplitDonut.vue'
import SenderTemplateMatrix from '@/components/charts/SenderTemplateMatrix.vue'
import FailureReasonsBar from '@/components/charts/FailureReasonsBar.vue'
import LatencyHistogram from '@/components/charts/LatencyHistogram.vue'

import RouteConfigSummary from '@/components/analytics/RouteConfigSummary.vue'

import { useFiltersStore } from '@/stores/filters'
import { getRouteById, ROUTE_TYPE_META } from '@/mock/routes'
import { generateRouteMetrics } from '@/mock/generateMetrics'
import { formatNumber, formatPercent, formatLatencyMs } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const store = useFiltersStore()

const routeData = computed(() => getRouteById(route.params.id))
const metrics = computed(() =>
  routeData.value ? generateRouteMetrics(routeData.value.id, store.dateRange) : null,
)

const tabs = [
  { label: 'Routes', to: '/routes' },
  { label: 'Analytics', to: '/analytics' },
]

// Aggregate per-channel totals across all time buckets for Sankey/Priority.
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

// Adaptive funnel stages per route type.
const funnelStages = computed(() => {
  if (!metrics.value) return []
  const r = routeData.value
  const t = metrics.value.totals
  const pc = perChannelTotals.value
  const smsC = pc.sms || { attempted: 0, delivered: 0 }
  const rcsC = pc.rcs || { attempted: 0, delivered: 0 }
  const tcC = pc.tc || { attempted: 0, delivered: 0 }
  const fallbackDelivered = Math.round(t.fallbackTriggered * 0.9)

  if (r.type === 'sms') {
    return [
      { label: 'Submitted', value: t.submitted },
      { label: 'Routed to operator', value: smsC.attempted },
      { label: 'Delivered', value: smsC.delivered },
    ]
  }
  if (r.type === 'rcs+sms') {
    return [
      { label: 'Submitted', value: t.submitted },
      { label: 'RCS agent matched', value: rcsC.attempted },
      { label: 'RCS delivered', value: rcsC.delivered },
      { label: 'SMS fallback', value: t.fallbackTriggered },
      { label: 'SMS delivered', value: fallbackDelivered },
    ]
  }
  if (r.type === 'tc+sms') {
    return [
      { label: 'Submitted', value: t.submitted },
      { label: 'VMN matched', value: tcC.attempted },
      { label: 'TC delivered', value: tcC.delivered },
      { label: 'SMS fallback', value: t.fallbackTriggered },
      { label: 'SMS delivered', value: fallbackDelivered },
    ]
  }
  // multi
  return [
    { label: 'Submitted', value: t.submitted },
    { label: 'P1 attempt', value: rcsC.attempted },
    { label: 'P1 delivered', value: rcsC.delivered },
    { label: 'P2 attempt', value: tcC.attempted },
    { label: 'P2 delivered', value: tcC.delivered },
    { label: 'SMS fallback', value: t.fallbackTriggered },
    { label: 'SMS delivered', value: fallbackDelivered },
  ]
})

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
    hasInactiveTemplates: r?.edgeCase === 'inactive-template',
    fallbackNeverTriggered: m && m.totals.fallbackTriggered === 0 && !edgeFlagIsSmsOnly(r),
  }
})

function edgeFlagIsSmsOnly(r) {
  return r?.type === 'sms'
}

const showFallbackWidgets = computed(() =>
  !edgeFlags.value.isSmsOnly && !edgeFlags.value.fallbackNeverTriggered,
)

const showPriorityChart = computed(() => routeData.value?.type === 'multi')

/** Shown above the Sankey: primary channel success vs SMS fallback (non–SMS-only routes). */
const routeFlowSummary = computed(() => {
  if (!metrics.value || !routeData.value) return null
  if (edgeFlags.value.isSmsOnly) return null
  if (edgeFlags.value.fallbackNeverTriggered) {
    return { variant: 'all-primary' }
  }
  const t = metrics.value.totals
  const submitted = t.submitted || 0
  const primaryPct = submitted
    ? ((t.delivered - t.fallbackTriggered * 0.9) / submitted) * 100
    : 0
  return {
    variant: 'split',
    primaryPct,
    fallbackPct: metrics.value.kpis.fallbackRate,
  }
})

// Compare-period: flag insufficient prior data
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
    <PageHeader title="Smart Routing" :tabs="tabs" />

    <!-- Breadcrumb -->
    <button
      @click="router.push('/routes')"
      class="flex items-center gap-1 text-caption text-ink-muted hover:text-ink"
    >
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m15 18-6-6 6-6" />
      </svg>
      Back to routes
    </button>

    <!-- Route header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <h2 class="text-section-heading text-ink">{{ routeData.name }}</h2>
          <StatusPill :tone="routeData.status === 'active' ? 'success' : 'warning'">
            {{ routeData.status === 'active' ? 'Active' : 'Paused' }}
          </StatusPill>
        </div>
        <p class="text-caption text-ink-muted">
          {{ routeData.enterprise }} · {{ ROUTE_TYPE_META[routeData.type].label }} · SMPP
          {{ routeData.smppAccount }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <DateRangePicker />
        <label class="flex items-center gap-2 text-caption text-ink-muted">
          <input
            type="checkbox"
            :checked="store.comparePeriod"
            @change="store.setComparePeriod($event.target.checked)"
            class="h-4 w-4 rounded border-surface-border text-brand-blue focus:ring-brand-blue"
          />
          Compare to previous period
        </label>
      </div>
    </div>

    <!-- Edge-case banners -->
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
      v-if="edgeFlags.hasInactiveTemplates"
      class="flex items-start gap-3 rounded-large border border-warning/30 bg-warning-soft px-4 py-3"
    >
      <svg class="mt-0.5 h-5 w-5 text-warning-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 9v4m0 4h.01M10.3 3.9 2 19a2 2 0 0 0 1.7 3h16.6A2 2 0 0 0 22 19L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </svg>
      <div>
        <p class="text-body font-semibold text-warning-text">
          {{ routeData.inactiveTemplates }} template(s) in this route are inactive
        </p>
        <p class="text-caption text-warning-text/80">
          Messages using them will fail. Review the Sender × Template matrix above.
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

    <!-- Route config summary -->
    <RouteConfigSummary :route="routeData" />

    <!-- Empty state for new/no-traffic routes -->
    <div v-if="edgeFlags.isNewRoute" class="card p-6">
      <EmptyState
        title="No messages routed yet"
        description="Traffic will appear here within a few minutes of your first send."
      />
    </div>

    <template v-else>
      <!-- KPI row -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Messages submitted"
          :value="formatNumber(metrics.kpis.submitted)"
          :delta="noPriorData ? null : metrics.kpis.volumeDelta"
        />
        <KpiCard
          label="Delivery rate"
          :value="formatPercent(metrics.kpis.deliveryRate)"
          :delta="noPriorData ? null : metrics.kpis.deliveryDelta"
        />
        <KpiCard
          v-if="!edgeFlags.isSmsOnly"
          label="Fallback triggered"
          :value="formatPercent(metrics.kpis.fallbackRate)"
          :delta="noPriorData ? null : metrics.kpis.fallbackDelta"
        />
        <KpiCard
          label="Avg latency"
          :value="formatLatencyMs(metrics.kpis.avgLatencyMs)"
          :delta="noPriorData ? null : metrics.kpis.latencyDelta"
        />
        <KpiCard
          label="Active templates"
          :value="`${metrics.templates.filter((t) => t.active).length} / ${metrics.templates.length}`"
          :delta="null"
          help="Active templates ÷ total templates in this route"
        />
      </div>

      <!-- Route Flow Sankey (hero viz) -->
      <div class="card p-4">
        <div class="mb-2 flex items-center justify-between">
          <div>
            <h3 class="text-sub-heading text-ink">Route flow</h3>
            <p class="text-caption text-ink-muted">
              End-to-end message flow across configured channels and failure reasons
            </p>
          </div>
        </div>
        <RouteFlowSankey
          :route="routeData"
          :totals="metrics.totals"
          :per-channel-totals="perChannelTotals"
          :reasons="metrics.reasonTotals"
          :flow-summary="routeFlowSummary"
        />
      </div>

      <!-- Volume trend + Adaptive funnel -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="card p-4 lg:col-span-2">
          <h3 class="mb-2 text-sub-heading text-ink">Volume over time</h3>
          <VolumeTrend :series="metrics.series" />
        </div>
        <div class="card p-4">
          <h3 class="mb-2 text-sub-heading text-ink">Delivery funnel</h3>
          <DeliveryFunnel :stages="funnelStages" :height="340" />
        </div>
      </div>

      <!-- Priority performance (multi-channel only) + Operator split -->
      <div class="grid grid-cols-1 gap-4" :class="showPriorityChart ? 'lg:grid-cols-2' : ''">
        <div v-if="showPriorityChart" class="card p-4">
          <h3 class="mb-2 text-sub-heading text-ink">Priority performance</h3>
          <p class="mb-3 text-caption text-ink-muted">
            Share of messages delivered at each priority step
          </p>
          <PriorityPerformance
            :route="routeData"
            :per-channel-totals="perChannelTotals"
            :height="220"
          />
        </div>
        <div class="card p-4">
          <h3 class="mb-2 text-sub-heading text-ink">
            {{ edgeFlags.isSmsOnly ? 'Operator split' : 'SMS fallback operator split' }}
          </h3>
          <OperatorSplitDonut :operators="metrics.operatorTotals" />
        </div>
      </div>

      <!-- Sender × Template matrix + Failure reasons -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="card p-4 lg:col-span-2">
          <h3 class="mb-2 text-sub-heading text-ink">Sender × Template performance</h3>
          <p class="mb-2 text-caption text-ink-muted">
            Delivery % per Sender ID / Template combination
          </p>
          <SenderTemplateMatrix
            :senders="metrics.senders"
            :templates="metrics.templates"
            :matrix="metrics.senderTemplateMatrix"
          />
        </div>
        <div class="card p-4">
          <h3 class="mb-2 text-sub-heading text-ink">Failure reasons</h3>
          <FailureReasonsBar :reasons="metrics.reasonTotals" :height="300" />
        </div>
      </div>

      <!-- Latency histogram -->
      <div class="card p-4">
        <h3 class="mb-2 text-sub-heading text-ink">Latency distribution</h3>
        <LatencyHistogram :buckets="metrics.latencyHistogram" />
      </div>
    </template>
  </div>
</template>
