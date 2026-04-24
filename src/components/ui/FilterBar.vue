<script setup>
import DateRangePicker from './DateRangePicker.vue'
import SelectInput from './SelectInput.vue'
import { useFiltersStore } from '@/stores/filters'
import { ENTERPRISES, CHANNEL_TYPES } from '@/mock/routes'

const store = useFiltersStore()

const enterpriseOptions = [
  { label: 'All enterprises', value: 'all' },
  ...ENTERPRISES.map((e) => ({ label: e, value: e })),
]

const channelOptions = [
  { label: 'All channels', value: 'all' },
  ...CHANNEL_TYPES.map((c) => ({ label: c.label, value: c.value })),
]
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <DateRangePicker />
    <div class="flex flex-wrap items-center gap-3">
      <SelectInput
        label="Enterprise"
        :model-value="store.enterprise"
        @update:model-value="store.setEnterprise"
        :options="enterpriseOptions"
      />
      <SelectInput
        label="Channel"
        :model-value="store.channel"
        @update:model-value="store.setChannel"
        :options="channelOptions"
      />
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
</template>
