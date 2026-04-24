<script setup>
defineProps({
  width: { type: String, default: '100%' },
  height: { type: String, default: '1rem' },
  rounded: { type: String, default: '0.375rem' },
})
</script>

<template>
  <div
    class="animate-pulse bg-surface-hover"
    :style="{ width, height, borderRadius: rounded }"
  />
</template>
