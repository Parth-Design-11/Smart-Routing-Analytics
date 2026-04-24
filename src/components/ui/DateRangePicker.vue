<script setup>
import { computed } from 'vue'
import { useFiltersStore } from '@/stores/filters'

const store = useFiltersStore()

const presets = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
]

const activePreset = computed({
  get: () => store.dateRange,
  set: (v) => store.setDateRange(v),
})
</script>

<template>
  <div class="inline-flex items-center gap-1 rounded-large border border-surface-border bg-surface p-1">
    <button
      v-for="p in presets"
      :key="p.value"
      @click="activePreset = p.value"
      class="rounded-std px-2.5 py-1 text-button-sm font-medium transition-colors"
      :class="
        activePreset === p.value
          ? 'bg-brand-blue-light text-brand-blue-deep'
          : 'text-ink-muted hover:text-ink'
      "
    >
      {{ p.label }}
    </button>
  </div>
</template>
