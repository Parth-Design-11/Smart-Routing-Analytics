<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  delta: { type: Number, default: null }, // % change vs previous
  deltaLabel: { type: String, default: 'vs previous period' },
  help: { type: String, default: '' },
  tone: {
    type: String,
    default: 'neutral', // neutral | positive | negative
    validator: (v) => ['neutral', 'positive', 'negative'].includes(v),
  },
  loading: { type: Boolean, default: false },
})

const deltaClass = computed(() => {
  if (props.delta == null) return 'text-ink-muted'
  if (props.delta > 0) return 'text-success-text'
  if (props.delta < 0) return 'text-danger-text'
  return 'text-ink-muted'
})

const formattedDelta = computed(() => {
  if (props.delta == null) return null
  const sign = props.delta > 0 ? '+' : ''
  return `${sign}${props.delta.toFixed(1)}%`
})
</script>

<template>
  <div class="card flex flex-col gap-2 p-4">
    <div class="flex items-center gap-1 text-caption text-ink-muted">
      {{ label }}
      <span v-if="help" :title="help" class="cursor-help">
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 17h.01M9.1 9a3 3 0 1 1 4.8 2.4c-.6.4-1.4 1-1.4 2.1" />
        </svg>
      </span>
    </div>

    <div v-if="loading" class="h-8 w-24 animate-pulse rounded bg-surface-hover" />
    <div v-else class="text-[28px] font-semibold leading-tight text-ink">
      {{ value }}
    </div>

    <div v-if="delta != null" class="flex items-center gap-1 text-caption">
      <span :class="deltaClass" class="font-medium">
        {{ formattedDelta }}
      </span>
      <span class="text-ink-muted">{{ deltaLabel }}</span>
    </div>
  </div>
</template>
