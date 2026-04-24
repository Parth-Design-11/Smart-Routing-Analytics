<script setup>
import { useRouter, useRoute } from 'vue-router'

const props = defineProps({
  title: { type: String, required: true },
  tabs: { type: Array, default: () => [] }, // [{ label, to, icon }]
})

const router = useRouter()
const route = useRoute()

function isTabActive(tab) {
  if (!tab.to) return false
  if (typeof tab.to === 'string') return route.path.startsWith(tab.to)
  return route.name === tab.to.name
}
</script>

<template>
  <div class="border-b border-surface-border">
    <h1 class="text-page-title text-ink">{{ title }}</h1>

    <div v-if="tabs.length" class="mt-5 flex items-center gap-3">
      <button
        v-for="tab in tabs"
        :key="tab.label"
        @click="tab.to && router.push(tab.to)"
        class="flex items-center gap-2 px-3 py-3 text-[14px] font-semibold transition-colors -mb-px"
        :class="
          isTabActive(tab)
            ? 'border-b-2 border-brand-blue text-ink'
            : 'text-ink-muted hover:text-ink'
        "
      >
        <component :is="tab.icon" v-if="tab.icon" class="h-4 w-4" />
        <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4l6 8v8l4-2v-6l6-8H4z" />
        </svg>
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>
