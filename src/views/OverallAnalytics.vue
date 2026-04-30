<script setup>
import { computed, ref, watch } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import Skeleton from '@/components/ui/Skeleton.vue'

import ChannelEfficiencyChart from '@/components/charts/ChannelEfficiencyChart.vue'
import ChannelFailurePie from '@/components/charts/ChannelFailurePie.vue'
import DeliveryFunnel from '@/components/charts/DeliveryFunnel.vue'
import PlotlyChart from '@/components/charts/PlotlyChart.vue'

import RouteLeaderboard from '@/components/analytics/RouteLeaderboard.vue'

import { useFiltersStore } from '@/stores/filters'
import { generateOverallMetrics } from '@/mock/generateMetrics'
import { getDateRangeLabel } from '@/utils/dateRange'
import { formatNumber, formatPercent } from '@/utils/format'
import { ENTERPRISES } from '@/mock/routes'
import { adjustOpacity, channelColors, PRIMARY_COLOR } from '@/utils/chartColors'

const tabs = [
  { label: 'Routes', to: '/routes' },
  { label: 'Analytics', to: '/analytics' },
]

const store = useFiltersStore()
const loading = ref(false)

// Local multi-select enterprise filter (does not touch global store).
const selectedEnterprises = ref([])
const enterpriseDropdownOpen = ref(false)
const enterpriseDropdownRef = ref(null)

const enterpriseLabel = computed(() => {
  if (selectedEnterprises.value.length === 0) return 'All enterprises'
  if (selectedEnterprises.value.length === 1) return selectedEnterprises.value[0]
  return `${selectedEnterprises.value.length} selected`
})

function toggleEnterprise(e) {
  const idx = selectedEnterprises.value.indexOf(e)
  if (idx === -1) {
    selectedEnterprises.value = [...selectedEnterprises.value, e]
  } else {
    selectedEnterprises.value = selectedEnterprises.value.filter((x) => x !== e)
  }
}

function handleEnterpriseOutside(event) {
  if (enterpriseDropdownRef.value && !enterpriseDropdownRef.value.contains(event.target)) {
    enterpriseDropdownOpen.value = false
  }
}

import { onMounted, onBeforeUnmount } from 'vue'
onMounted(() => document.addEventListener('mousedown', handleEnterpriseOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleEnterpriseOutside))

// Derive the metrics snapshot from filter state.
const metrics = computed(() => generateOverallMetrics(store.dateRange))

// Apply enterprise filter to the leaderboard.
const filteredLeaderboard = computed(() => {
  if (selectedEnterprises.value.length === 0) return metrics.value.leaderboard
  return metrics.value.leaderboard.filter((r) =>
    selectedEnterprises.value.includes(r.enterprise),
  )
})

const filterActive = computed(() => selectedEnterprises.value.length > 0)

const filteredEmpty = computed(
  () => filterActive.value && filteredLeaderboard.value.length === 0,
)

const zeroData = computed(() => metrics.value.totals.submitted === 0)

const deliveryPerformanceFunnelStages = computed(() => {
  const t = metrics.value.totals
  return [
    { label: 'Total messages submitted', value: t.submitted },
    { label: 'Total delivered', value: t.delivered },
    { label: 'Total failed', value: t.failed },
  ]
})

const channelTrendMeta = {
  tc: { label: 'TrueCaller', color: PRIMARY_COLOR },
  rcs: { label: 'RCS', color: PRIMARY_COLOR },
  sms: { label: 'SMS', color: PRIMARY_COLOR },
}

const dateLabel = computed(() =>
  getDateRangeLabel(store.dateRange, store.customStart, store.customEnd),
)

// Fake a short loading pulse when filters change.
watch(
  () => store.dateRange,
  () => {
    loading.value = true
    setTimeout(() => (loading.value = false), 320)
  },
  { immediate: false },
)

function clearFilters() {
  selectedEnterprises.value = []
}

// Currency formatter for cost savings.
function formatCurrency(v) {
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`
  return `₹${Math.round(v)}`
}

function channelTrendValues(channel) {
  return metrics.value.series.map((s) => s.perChannel[channel]?.delivered || 0)
}

function channelLineData(channel) {
  const meta = channelTrendMeta[channel]
  return [
    {
      x: metrics.value.series.map((s) => s.ts),
      y: channelTrendValues(channel),
      name: meta.label,
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: meta.color, width: 1, shape: 'spline', smoothing: 0.55 },
      marker: { color: meta.color, size: 4 },
      fill: 'tozeroy',
      fillcolor: adjustOpacity(PRIMARY_COLOR, 0.08),
      hovertemplate: `<b>%{x|%d %b}</b><br>${meta.label}: %{y:,.0f} delivered<extra></extra>`,
    },
  ]
}

const channelLineLayout = {
  showlegend: false,
  margin: { l: 44, r: 8, t: 8, b: 28 },
  xaxis: { type: 'date', tickformat: '%d %b', nticks: 3, showgrid: false },
  yaxis: { tickformat: '~s', nticks: 3, zeroline: false },
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Smart Routing" :tabs="tabs" />

    <!-- Sticky filter bar -->
    <div class="sticky top-0 z-10 -mx-6 border-b border-surface-border bg-surface/95 px-6 py-3 backdrop-blur">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <DateRangePicker />

        <!-- Multi-select enterprise dropdown -->
        <div class="relative" ref="enterpriseDropdownRef">
          <button
            @click="enterpriseDropdownOpen = !enterpriseDropdownOpen"
            class="inline-flex items-center gap-2 rounded-large border border-surface-border bg-surface px-3 py-1.5 text-button-sm font-medium text-ink-muted transition-colors hover:text-ink"
            :class="selectedEnterprises.length > 0 ? 'border-brand-blue text-brand-blue-deep' : ''"
          >
            <span>{{ enterpriseLabel }}</span>
            <svg class="h-3.5 w-3.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <div
            v-if="enterpriseDropdownOpen"
            class="absolute right-0 top-full z-20 mt-1.5 rounded-large border border-surface-border bg-surface p-1 shadow-card"
            style="min-width: 200px"
          >
            <button
              @click="selectedEnterprises = []; enterpriseDropdownOpen = false"
              class="flex w-full items-center gap-2 rounded-std px-3 py-1.5 text-body text-ink-muted hover:bg-surface-muted hover:text-ink"
            >
              All enterprises
            </button>
            <button
              v-for="e in ENTERPRISES"
              :key="e"
              @click="toggleEnterprise(e)"
              class="flex w-full items-center gap-2 rounded-std px-3 py-1.5 text-body hover:bg-surface-muted"
              :class="selectedEnterprises.includes(e) ? 'text-brand-blue-deep font-medium' : 'text-ink-muted'"
            >
              <span
                class="inline-block h-3.5 w-3.5 rounded-std border"
                :class="selectedEnterprises.includes(e) ? 'border-brand-blue bg-brand-blue' : 'border-surface-border'"
              />
              {{ e }}
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- Filter-returns-empty edge state -->
    <div v-if="filteredEmpty" class="card p-6">
      <EmptyState
        title="No routes match these filters"
        description="Try selecting different enterprises."
      >
        <template #actions>
          <button class="btn-secondary" @click="clearFilters">Clear filters</button>
        </template>
      </EmptyState>
    </div>

    <!-- Zero-data edge state -->
    <div v-else-if="zeroData" class="card p-6">
      <EmptyState
        title="No messages routed in this window"
        description="Try a wider time range or come back after traffic picks up."
      />
    </div>

    <template v-else>

      <!-- Section A: Summary Ribbon -->
      <div>
        <h2 class="mb-3 text-sub-heading text-ink">Summary</h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            label="Total Routes Configured"
            :value="String(metrics.routeSummary.totalRoutes)"
            :delta="null"
            :loading="loading"
          />
          <KpiCard
            label="Active Routes"
            :value="String(metrics.routeSummary.activeRoutes)"
            :delta="null"
            :loading="loading"
          />
          <KpiCard
            label="Routes Utilized"
            :value="String(metrics.routeSummary.routesUtilized)"
            :delta="null"
            :loading="loading"
          />
          <KpiCard
            label="Route Utilization"
            :value="formatPercent(metrics.routeSummary.utilizationPct)"
            help="Routes with ≥1 message in the selected period ÷ total routes"
            :delta="null"
            :loading="loading"
          />
          <KpiCard
            label="Cost Savings (Est.)"
            :value="formatCurrency(metrics.routeSummary.estimatedCostSavings)"
            help="Estimated savings vs sending all messages via SMS"
            :delta="null"
            tone="positive"
            :loading="loading"
          />
        </div>
      </div>

      <!-- Section B: Channel Attribution -->
      <div>
        <h2 class="mb-3 text-sub-heading text-ink">Channel Attribution</h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="card p-4">
            <p class="text-caption text-ink-muted">Delivered on TrueCaller</p>
            <Skeleton v-if="loading" height="32px" class="mt-2" />
            <p v-else class="mt-1 font-mono text-section-heading tabular-nums text-ink">
              {{ formatNumber(metrics.channelTotals.tc.delivered) }}
            </p>
            <p class="mt-0.5 text-micro text-ink-muted">
              of {{ formatNumber(metrics.channelTotals.tc.attempted) }} attempted
            </p>
            <Skeleton v-if="loading" height="112px" class="mt-3" />
            <PlotlyChart
              v-else
              class="mt-3"
              :data="channelLineData('tc')"
              :layout="channelLineLayout"
              height="112px"
            />
          </div>
          <div class="card p-4">
            <p class="text-caption text-ink-muted">Delivered on RCS</p>
            <Skeleton v-if="loading" height="32px" class="mt-2" />
            <p v-else class="mt-1 font-mono text-section-heading tabular-nums text-ink">
              {{ formatNumber(metrics.channelTotals.rcs.delivered) }}
            </p>
            <p class="mt-0.5 text-micro text-ink-muted">
              of {{ formatNumber(metrics.channelTotals.rcs.attempted) }} attempted
            </p>
            <Skeleton v-if="loading" height="112px" class="mt-3" />
            <PlotlyChart
              v-else
              class="mt-3"
              :data="channelLineData('rcs')"
              :layout="channelLineLayout"
              height="112px"
            />
          </div>
          <div class="card p-4">
            <p class="text-caption text-ink-muted">Delivered on SMS</p>
            <Skeleton v-if="loading" height="32px" class="mt-2" />
            <p v-else class="mt-1 font-mono text-section-heading tabular-nums text-ink">
              {{ formatNumber(metrics.channelTotals.sms.delivered) }}
            </p>
            <p class="mt-0.5 text-micro text-ink-muted">
              of {{ formatNumber(metrics.channelTotals.sms.attempted) }} attempted
            </p>
            <Skeleton v-if="loading" height="112px" class="mt-3" />
            <PlotlyChart
              v-else
              class="mt-3"
              :data="channelLineData('sms')"
              :layout="channelLineLayout"
              height="112px"
            />
          </div>
        </div>
      </div>

      <!-- Section C: Delivery Performance -->
      <div>
        <h2 class="mb-3 text-sub-heading text-ink">Delivery Performance</h2>
        <p class="mb-3 text-caption text-ink-muted">
          Volume at each outcome: submitted traffic, successful deliveries, and failures.
        </p>
        <div class="card p-4">
          <Skeleton v-if="loading" height="300px" />
          <DeliveryFunnel
            v-else
            :stages="deliveryPerformanceFunnelStages"
            :height="300"
          />
        </div>
      </div>

      <!-- Section D: Channel Efficiency -->
      <div>
        <h2 class="mb-3 text-sub-heading text-ink">Channel Efficiency</h2>
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div class="card p-4">
            <div class="mb-2 flex items-center gap-2">
              <span
                class="inline-block h-2.5 w-2.5 rounded-full"
                :style="{ backgroundColor: channelTrendMeta.tc.color }"
              />
              <h3 class="text-sub-heading text-ink">TrueCaller</h3>
            </div>
            <Skeleton v-if="loading" height="220px" />
            <ChannelEfficiencyChart v-else channel="tc" :data="metrics.channelTotals.tc" />
          </div>
          <div class="card p-4">
            <div class="mb-2 flex items-center gap-2">
              <span
                class="inline-block h-2.5 w-2.5 rounded-full"
                :style="{ backgroundColor: channelTrendMeta.rcs.color }"
              />
              <h3 class="text-sub-heading text-ink">RCS</h3>
            </div>
            <Skeleton v-if="loading" height="220px" />
            <ChannelEfficiencyChart v-else channel="rcs" :data="metrics.channelTotals.rcs" />
          </div>
          <div class="card p-4">
            <div class="mb-2 flex items-center gap-2">
              <span
                class="inline-block h-2.5 w-2.5 rounded-full"
                :style="{ backgroundColor: channelTrendMeta.sms.color }"
              />
              <h3 class="text-sub-heading text-ink">SMS</h3>
            </div>
            <Skeleton v-if="loading" height="220px" />
            <ChannelEfficiencyChart v-else channel="sms" :data="metrics.channelTotals.sms" />
          </div>
        </div>
      </div>

      <!-- Section E: Failure Analysis -->
      <div>
        <h2 class="mb-3 text-sub-heading text-ink">Failure Analysis</h2>
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div class="card p-4">
            <h3 class="mb-2 text-sub-heading text-ink">RCS Failures</h3>
            <Skeleton v-if="loading" height="220px" />
            <ChannelFailurePie v-else channel="rcs" :reasons="metrics.channelFailureReasons.rcs" />
          </div>
          <div class="card p-4">
            <h3 class="mb-2 text-sub-heading text-ink">TrueCaller Failures</h3>
            <Skeleton v-if="loading" height="220px" />
            <ChannelFailurePie v-else channel="tc" :reasons="metrics.channelFailureReasons.tc" />
          </div>
          <div class="card p-4">
            <h3 class="mb-2 text-sub-heading text-ink">SMS Failures</h3>
            <Skeleton v-if="loading" height="220px" />
            <ChannelFailurePie v-else channel="sms" :reasons="metrics.channelFailureReasons.sms" />
          </div>
        </div>
      </div>

      <!-- Section F: Route Leaderboard -->
      <RouteLeaderboard :rows="filteredLeaderboard" />

    </template>
  </div>
</template>
