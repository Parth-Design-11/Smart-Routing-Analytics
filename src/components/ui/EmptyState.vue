<script setup>
defineProps({
  title: { type: String, default: 'Nothing here yet' },
  description: { type: String, default: '' },
  icon: { type: String, default: 'inbox' },
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 p-10 text-center">
    <div
      class="flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover text-ink-muted"
    >
      <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M4 13h4l2 3h4l2-3h4M4 13V6h16v7M4 13v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" />
      </svg>
    </div>
    <div class="space-y-1">
      <p class="text-body font-semibold text-ink">{{ title }}</p>
      <p v-if="description" class="max-w-md text-caption text-ink-muted">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.actions" class="mt-1">
      <slot name="actions" />
    </div>
  </div>
</template>
