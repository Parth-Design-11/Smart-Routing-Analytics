<script setup>
import { useRouter } from 'vue-router'
import { formatPercent, formatNumber } from '@/utils/format'

defineProps({
  rows: { type: Array, required: true },
})

const router = useRouter()
function openRoute(id) {
  router.push({ name: 'route-analytics', params: { id } })
}
</script>

<template>
  <div class="card">
    <div class="flex items-center justify-between border-b border-surface-border px-4 py-3">
      <div>
        <h3 class="text-sub-heading text-ink">Underperforming routes</h3>
        <p class="text-caption text-ink-muted">Delivery &lt; 85% or sharp drop vs previous period</p>
      </div>
      <span
        class="pill"
        :class="rows.length > 0 ? 'bg-danger-soft text-danger-text' : 'bg-success-soft text-success-text'"
      >
        {{ rows.length }} flagged
      </span>
    </div>

    <div v-if="!rows.length" class="px-4 py-6 text-center text-caption text-ink-muted">
      All routes are delivering within expected range.
    </div>

    <ul v-else class="divide-y divide-surface-border">
      <li
        v-for="r in rows"
        :key="r.id"
        class="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
        @click="openRoute(r.id)"
      >
        <div class="min-w-0">
          <p class="truncate text-body font-medium text-ink">{{ r.name }}</p>
          <p class="truncate text-caption text-ink-muted">
            {{ r.enterprise }} · {{ formatNumber(r.volume) }} msgs
          </p>
        </div>
        <div class="text-right">
          <p class="text-body font-semibold text-danger-text">
            {{ formatPercent(r.deliveryRate) }}
          </p>
          <p
            class="text-caption"
            :class="r.deliveryDelta < 0 ? 'text-danger-text' : 'text-ink-muted'"
          >
            {{ r.deliveryDelta > 0 ? '+' : '' }}{{ r.deliveryDelta.toFixed(1) }}% vs prev
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>
