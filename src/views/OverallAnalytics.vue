<script setup>
import { computed, ref, watch } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import Skeleton from '@/components/ui/Skeleton.vue'

import VolumeTrend from '@/components/charts/VolumeTrend.vue'
import DeliveryRateTrend from '@/components/charts/DeliveryRateTrend.vue'
import ChannelMixDonut from '@/components/charts/ChannelMixDonut.vue'
import RouteTypeDonut from '@/components/charts/RouteTypeDonut.vue'
import DeliveryFunnel from '@/components/charts/DeliveryFunnel.vue'
import FailureReasonsBar from '@/components/charts/FailureReasonsBar.vue'
import OperatorHeatmap from '@/components/charts/OperatorHeatmap.vue'

import RouteLeaderboard from '@/components/analytics/RouteLeaderboard.vue'
import UnderperformingRoutes from '@/components/analytics/UnderperformingRoutes.vue'
import AnomaliesTable from '@/components/analytics/AnomaliesTable.vue'

import { useFiltersStore } from '@/stores/filters'
import { generateOverallMetrics } from '@/mock/generateMetrics'
import { formatNumber, formatPercent, formatLatencyMs } from '@/utils/format'

const tabs = [
  { label: 'Routes', to: '/routes' },
  { label: 'Analytics', to: '/analytics' },
]

const store = useFiltersStore()
const loading = ref(false)

// Derive the metrics snapshot from filter state.
const metrics = computed(() => generateOverallMetrics(store.dateRange))

// Apply enterprise + channel filters to the leaderboard / underperformers.
const filteredLeaderboard = computed(() => {
  let rows = metrics.value.leaderboard
  if (store.enterprise !== 'all') rows = rows.filter((r) => r.enterprise === store.enterprise)
  if (store.channel !== 'all') rows = rows.filter((r) => r.channels.includes(store.channel))
  return rows
})

const filterActive = computed(
  () => store.enterprise !== 'all' || store.channel !== 'all' || store.routeType !== 'all',
)

const filteredEmpty = computed(
  () => filterActive.value && filteredLeaderboard.value.length === 0,
)

const zeroData = computed(() => metrics.value.totals.submitted === 0)

// Fake a short loading pulse when filters change so skeletons are visible.
watch(
  () => store.dateRange,
  () => {
    loading.value = true
    setTimeout(() => (loading.value = false), 320)
  },
  { immediate: false },
)

function clearFilters() {
  store.setEnterprise('all')
  store.setChannel('all')
  store.setRouteType('all')
}

// Compare-period warning when no prior data exists.
const noPriorData = computed(
  () => store.comparePeriod && metrics.value.kpis.submitted < 1000,
)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Smart Routing" :tabs="tabs" />

    <!-- Sticky filter bar -->
    <div class="sticky top-0 z-10 -mx-6 border-b border-surface-border bg-surface/95 px-6 py-3 backdrop-blur">
      <FilterBar />
      <div class="mt-2 flex items-center justify-between text-caption text-ink-muted">
        <span>Data shown for last {{ store.dateRange }} · aggregator-wide</span>
        <span class="flex items-center gap-1">
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          Last updated 2 min ago
        </span>
      </div>
    </div>

    <!-- Filter-returns-empty edge state -->
    <div v-if="filteredEmpty" class="card p-6">
      <EmptyState
        title="No routes match these filters"
        description="Try widening the enterprise or channel filter."
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
      <!-- Compare-period no prior data banner -->
      <div
        v-if="noPriorData"
        class="flex items-start gap-2 rounded-large border border-surface-border bg-surface-muted px-4 py-3 text-caption text-ink-subtle"
      >
        <svg class="mt-0.5 h-4 w-4 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9" /><path d="M12 8v4m0 4h.01" />
        </svg>
        Insufficient data in the prior period — deltas shown are directional only.
      </div>

      <!-- KPI row -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Messages submitted"
          :value="formatNumber(metrics.kpis.submitted)"
          :delta="metrics.kpis.volumeDelta"
          :loading="loading"
        />
        <KpiCard
          label="Delivery rate"
          :value="formatPercent(metrics.kpis.deliveryRate)"
          :delta="metrics.kpis.deliveryDelta"
          help="Messages marked delivered ÷ messages submitted"
          :loading="loading"
        />
        <KpiCard
          label="Fallback rate"
          :value="formatPercent(metrics.kpis.fallbackRate)"
          :delta="metrics.kpis.fallbackDelta"
          help="Share of non-SMS attempts that fell back to SMS"
          :loading="loading"
        />
        <KpiCard
          label="Avg end-to-end latency"
          :value="formatLatencyMs(metrics.kpis.avgLatencyMs)"
          :delta="metrics.kpis.latencyDelta"
          :loading="loading"
        />
        <KpiCard
          label="Active routes"
          :value="metrics.kpis.activeRoutes"
          :delta="null"
          :loading="loading"
        />
      </div>

      <!-- Row 1: Volume trend + channel mix -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="card p-4 lg:col-span-2">
          <div class="mb-2 flex items-center justify-between">
            <h3 class="text-sub-heading text-ink">Volume trend</h3>
            <span class="text-caption text-ink-muted">Attempts per channel</span>
          </div>
          <Skeleton v-if="loading" height="280px" />
          <VolumeTrend v-else :series="metrics.series" />
        </div>
        <div class="card p-4">
          <h3 class="mb-2 text-sub-heading text-ink">Channel attempt mix</h3>
          <Skeleton v-if="loading" height="260px" />
          <ChannelMixDonut v-else :series="metrics.series" />
        </div>
      </div>

      <!-- Row 2: Delivery rate + delivery funnel -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="card p-4 lg:col-span-2">
          <h3 class="mb-2 text-sub-heading text-ink">Delivery rate by channel</h3>
          <Skeleton v-if="loading" height="280px" />
          <DeliveryRateTrend v-else :series="metrics.series" />
        </div>
        <div class="card p-4">
          <h3 class="mb-2 text-sub-heading text-ink">Delivery funnel</h3>
          <Skeleton v-if="loading" height="360px" />
          <DeliveryFunnel v-else :totals="metrics.totals" />
        </div>
      </div>

      <!-- Row 3: Route-type donut + Failure reasons -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="card p-4">
          <h3 class="mb-2 text-sub-heading text-ink">Route-type distribution</h3>
          <Skeleton v-if="loading" height="260px" />
          <RouteTypeDonut v-else :counts="metrics.routeTypeCounts" />
        </div>
        <div class="card p-4 lg:col-span-2">
          <h3 class="mb-2 text-sub-heading text-ink">Failure reasons</h3>
          <Skeleton v-if="loading" height="280px" />
          <FailureReasonsBar v-else :reasons="metrics.reasonTotals" />
        </div>
      </div>

      <!-- Row 4: Operator × channel heatmap -->
      <div class="card p-4">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-sub-heading text-ink">Operator × channel delivery</h3>
          <span class="text-caption text-ink-muted">Volume-weighted delivery %</span>
        </div>
        <Skeleton v-if="loading" height="280px" />
        <OperatorHeatmap v-else :matrix="metrics.operatorChannelMatrix" />
      </div>

      <!-- Row 5: Leaderboard -->
      <RouteLeaderboard :rows="filteredLeaderboard" />

      <!-- Row 6: Underperforming + Anomalies -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UnderperformingRoutes :rows="metrics.underperforming" />
        <AnomaliesTable :rows="metrics.anomalies" />
      </div>
    </template>
  </div>
</template>
