<script setup>
import { computed, ref, watch } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import Skeleton from '@/components/ui/Skeleton.vue'

import ChannelEfficiencyChart from '@/components/charts/ChannelEfficiencyChart.vue'
import ChannelFailurePie from '@/components/charts/ChannelFailurePie.vue'

import RouteLeaderboard from '@/components/analytics/RouteLeaderboard.vue'

import { useFiltersStore } from '@/stores/filters'
import { generateOverallMetrics } from '@/mock/generateMetrics'
import { getDateRangeLabel } from '@/utils/dateRange'
import { formatNumber, formatPercent } from '@/utils/format'
import { ENTERPRISES } from '@/mock/routes'

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

      <!-- Section B: Delivery Performance -->
      <div>
        <h2 class="mb-3 text-sub-heading text-ink">Delivery Performance</h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="card p-4">
            <p class="text-caption text-ink-muted">Total Messages Submitted</p>
            <Skeleton v-if="loading" height="32px" class="mt-2" />
            <p v-else class="mt-1 font-mono text-section-heading tabular-nums text-ink">
              {{ formatNumber(metrics.totals.submitted) }}
            </p>
          </div>
          <div class="card p-4">
            <p class="text-caption text-ink-muted">Total Delivered</p>
            <Skeleton v-if="loading" height="32px" class="mt-2" />
            <p v-else class="mt-1 font-mono text-section-heading tabular-nums text-success-text">
              {{ formatNumber(metrics.totals.delivered) }}
            </p>
          </div>
          <div class="card p-4">
            <p class="text-caption text-ink-muted">Total Failed</p>
            <Skeleton v-if="loading" height="32px" class="mt-2" />
            <p v-else class="mt-1 font-mono text-section-heading tabular-nums text-danger-text">
              {{ formatNumber(metrics.totals.failed) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Section C: Channel Attribution -->
      <div>
        <h2 class="mb-3 text-sub-heading text-ink">Channel Attribution</h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="card p-4 border-l-4" style="border-left-color: #12b76a">
            <p class="text-caption text-ink-muted">Delivered on TrueCaller</p>
            <Skeleton v-if="loading" height="32px" class="mt-2" />
            <p v-else class="mt-1 font-mono text-section-heading tabular-nums text-ink">
              {{ formatNumber(metrics.channelTotals.tc.delivered) }}
            </p>
            <p class="mt-0.5 text-micro text-ink-muted">
              of {{ formatNumber(metrics.channelTotals.tc.attempted) }} attempted
            </p>
          </div>
          <div class="card p-4 border-l-4" style="border-left-color: #7839ee">
            <p class="text-caption text-ink-muted">Delivered on RCS</p>
            <Skeleton v-if="loading" height="32px" class="mt-2" />
            <p v-else class="mt-1 font-mono text-section-heading tabular-nums text-ink">
              {{ formatNumber(metrics.channelTotals.rcs.delivered) }}
            </p>
            <p class="mt-0.5 text-micro text-ink-muted">
              of {{ formatNumber(metrics.channelTotals.rcs.attempted) }} attempted
            </p>
          </div>
          <div class="card p-4 border-l-4" style="border-left-color: #1570ef">
            <p class="text-caption text-ink-muted">Delivered on SMS</p>
            <Skeleton v-if="loading" height="32px" class="mt-2" />
            <p v-else class="mt-1 font-mono text-section-heading tabular-nums text-ink">
              {{ formatNumber(metrics.channelTotals.sms.delivered) }}
            </p>
            <p class="mt-0.5 text-micro text-ink-muted">
              of {{ formatNumber(metrics.channelTotals.sms.attempted) }} attempted
            </p>
          </div>
        </div>
      </div>

      <!-- Section D: Channel Efficiency -->
      <div>
        <h2 class="mb-3 text-sub-heading text-ink">Channel Efficiency</h2>
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div class="card p-4">
            <div class="mb-2 flex items-center gap-2">
              <span class="inline-block h-2.5 w-2.5 rounded-full" style="background:#12b76a" />
              <h3 class="text-sub-heading text-ink">TrueCaller</h3>
            </div>
            <Skeleton v-if="loading" height="220px" />
            <ChannelEfficiencyChart v-else channel="tc" :data="metrics.channelTotals.tc" />
          </div>
          <div class="card p-4">
            <div class="mb-2 flex items-center gap-2">
              <span class="inline-block h-2.5 w-2.5 rounded-full" style="background:#7839ee" />
              <h3 class="text-sub-heading text-ink">RCS</h3>
            </div>
            <Skeleton v-if="loading" height="220px" />
            <ChannelEfficiencyChart v-else channel="rcs" :data="metrics.channelTotals.rcs" />
          </div>
          <div class="card p-4">
            <div class="mb-2 flex items-center gap-2">
              <span class="inline-block h-2.5 w-2.5 rounded-full" style="background:#1570ef" />
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
