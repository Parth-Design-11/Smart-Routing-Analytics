<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/ui/DataTable.vue'
import ChannelStack from '@/components/ui/ChannelStack.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import { ROUTE_TYPE_META } from '@/mock/routes'
import { formatNumber, formatPercent, formatLatencyMs } from '@/utils/format'

const props = defineProps({
  rows: { type: Array, required: true },
})

const router = useRouter()
const sortKey = ref('volume')
const sortDir = ref('desc')

function setSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'desc'
  }
}

const sortedRows = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...props.rows].sort((a, b) => {
    const av = a[sortKey.value]
    const bv = b[sortKey.value]
    if (av < bv) return -1 * dir
    if (av > bv) return 1 * dir
    return 0
  })
})

const columns = [
  { key: 'name', label: 'Route' },
  { key: 'enterprise', label: 'Enterprise' },
  { key: 'type', label: 'Type' },
  { key: 'channels', label: 'Channels' },
  { key: 'volume', label: 'Volume', align: 'right', sortable: true },
  { key: 'deliveryRate', label: 'Delivery %', align: 'right', sortable: true },
  { key: 'fallbackRate', label: 'Fallback %', align: 'right', sortable: true },
  { key: 'avgLatencyMs', label: 'Avg latency', align: 'right', sortable: true },
  { key: 'sparkline', label: 'Trend', align: 'center' },
  { key: 'status', label: 'Status' },
]

// Build a tiny inline-SVG sparkline for the Delivery-% trend.
function sparkPath(values) {
  if (!values || !values.length) return ''
  const w = 80
  const h = 20
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = w / (values.length - 1 || 1)
  return values
    .map((v, i) => {
      const x = i * step
      const y = h - ((v - min) / range) * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function openRoute(row) {
  router.push({ name: 'route-analytics', params: { id: row.id } })
}
</script>

<template>
  <div class="card">
    <div class="flex items-center justify-between border-b border-surface-border px-4 py-3">
      <h3 class="text-sub-heading text-ink">Route leaderboard</h3>
      <span class="text-caption text-ink-muted">{{ rows.length }} routes</span>
    </div>
    <DataTable :columns="columns" :rows="sortedRows" row-key="id" @row-click="openRoute">
      <template
        v-for="col in columns.filter((c) => c.sortable)"
        :key="`head-${col.key}`"
        #[`header-${col.key}`]
      >
        <button class="inline-flex items-center gap-1 hover:text-ink" @click.stop="setSort(col.key)">
          {{ col.label }}
          <span v-if="sortKey === col.key" class="text-[10px]">
            {{ sortDir === 'asc' ? '▲' : '▼' }}
          </span>
        </button>
      </template>

      <template #cell-type="{ row }">
        <span class="text-caption text-ink-subtle">{{ ROUTE_TYPE_META[row.type]?.label }}</span>
      </template>
      <template #cell-channels="{ row }">
        <ChannelStack :channels="row.channels" />
      </template>
      <template #cell-volume="{ row }">
        <span class="font-mono tabular-nums">{{ formatNumber(row.volume) }}</span>
      </template>
      <template #cell-deliveryRate="{ row }">
        <span
          class="font-mono tabular-nums"
          :class="row.deliveryRate < 80 ? 'text-danger-text' : 'text-ink'"
        >
          {{ formatPercent(row.deliveryRate) }}
        </span>
      </template>
      <template #cell-fallbackRate="{ row }">
        <span class="font-mono tabular-nums text-ink-subtle">
          {{ formatPercent(row.fallbackRate) }}
        </span>
      </template>
      <template #cell-avgLatencyMs="{ row }">
        <span class="font-mono tabular-nums text-ink-subtle">
          {{ formatLatencyMs(row.avgLatencyMs) }}
        </span>
      </template>
      <template #cell-sparkline="{ row }">
        <svg viewBox="0 0 80 20" class="inline-block h-5 w-20 text-brand-blue">
          <path
            :d="sparkPath(row.sparkline)"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </template>
      <template #cell-status="{ row }">
        <StatusPill :tone="row.status === 'active' ? 'success' : 'warning'">
          {{ row.status === 'active' ? 'Active' : 'Paused' }}
        </StatusPill>
      </template>
    </DataTable>
  </div>
</template>
