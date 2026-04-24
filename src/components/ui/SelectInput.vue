<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, required: true }, // [{ label, value }]
  label: { type: String, default: '' },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <label class="flex items-center gap-2 text-caption text-ink-muted">
    <span v-if="label">{{ label }}</span>
    <div class="relative">
      <select
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        class="appearance-none rounded-large border border-surface-border bg-surface px-3 py-1.5 pr-8 text-body text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
      >
        <option v-for="opt in options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <svg
        class="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  </label>
</template>
