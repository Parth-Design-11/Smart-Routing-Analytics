<script setup>
const props = defineProps({
  tone: {
    type: String,
    default: 'neutral', // neutral | success | warning | danger | info
    validator: (v) => ['neutral', 'success', 'warning', 'danger', 'info'].includes(v),
  },
})

const map = {
  neutral: 'bg-surface-hover text-ink-subtle',
  success: 'bg-success-soft text-success-text',
  warning: 'bg-warning-soft text-warning-text',
  danger: 'bg-danger-soft text-danger-text',
  info: 'bg-brand-blue-light text-brand-blue-deep',
}
</script>

<template>
  <span class="pill" :class="map[tone]">
    <slot />
  </span>
</template>
