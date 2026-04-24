<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    @click="$emit('update:modelValue', !modelValue)"
    class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
    :class="modelValue ? 'bg-success' : 'bg-surface-border-strong'"
  >
    <span
      class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
      :class="modelValue ? 'translate-x-4' : 'translate-x-0.5'"
    />
  </button>
</template>
