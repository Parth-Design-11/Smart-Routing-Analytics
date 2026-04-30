<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/ui/DataTable.vue'
import ChannelStack from '@/components/ui/ChannelStack.vue'
import { formatNumber } from '@/utils/format'

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
  { key: 'name',          label: 'Route' },
  { key: 'channels',      label: 'Channels' },
  { key: 'volume',        label: 'Submitted',      align: 'right', sortable: true },
  { key: 'delOnTc',       label: 'Del. on TC',     align: 'right', sortable: true },
  { key: 'delOnRcs',      label: 'Del. on RCS',    align: 'right', sortable: true },
  { key: 'delOnSms',      label: 'Del. on SMS',    align: 'right', sortable: true },
  { key: 'totalFailed',   label: 'Total Failed',   align: 'right', sortable: true },
  { key: 'timesUtilized', label: 'Times Utilized', align: 'right', sortable: true },
]

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

      <template #cell-channels="{ row }">
        <ChannelStack :channels="row.channels" />
      </template>
      <template #cell-volume="{ row }">
        <span class="font-mono tabular-nums">{{ formatNumber(row.volume) }}</span>
      </template>
      <template #cell-delOnTc="{ row }">
        <span class="font-mono tabular-nums text-ink-subtle">{{ formatNumber(row.delOnTc) }}</span>
      </template>
      <template #cell-delOnRcs="{ row }">
        <span class="font-mono tabular-nums text-ink-subtle">{{ formatNumber(row.delOnRcs) }}</span>
      </template>
      <template #cell-delOnSms="{ row }">
        <span class="font-mono tabular-nums text-ink-subtle">{{ formatNumber(row.delOnSms) }}</span>
      </template>
      <template #cell-totalFailed="{ row }">
        <span
          class="font-mono tabular-nums"
          :class="row.totalFailed > 0 ? 'text-danger-text' : 'text-ink-subtle'"
        >
          {{ formatNumber(row.totalFailed) }}
        </span>
      </template>
      <template #cell-timesUtilized="{ row }">
        <span class="font-mono tabular-nums text-ink-subtle">{{ row.timesUtilized }}</span>
      </template>
    </DataTable>
  </div>
</template>
