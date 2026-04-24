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
    </div>
  </div>
</template>
