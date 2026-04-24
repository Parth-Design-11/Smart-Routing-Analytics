<script setup>
defineProps({
  rows: { type: Array, required: true },
})

function formatRelative(iso) {
  const d = new Date(iso)
  const now = new Date('2026-04-23T00:00:00Z').getTime()
  const diffMin = Math.round((now - d.getTime()) / 60000)
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffMin < 60 * 24) return `${Math.round(diffMin / 60)}h ago`
  return `${Math.round(diffMin / (60 * 24))}d ago`
}

const SEVERITY_META = {
  critical: { dot: 'bg-danger', label: 'Critical', text: 'text-danger-text' },
  warning: { dot: 'bg-warning', label: 'Warning', text: 'text-warning-text' },
  info: { dot: 'bg-brand-blue', label: 'Info', text: 'text-brand-blue-deep' },
}
</script>

<template>
  <div class="card">
    <div class="flex items-center justify-between border-b border-surface-border px-4 py-3">
      <h3 class="text-sub-heading text-ink">Recent anomalies</h3>
      <span class="text-caption text-ink-muted">last 24h</span>
    </div>

    <div v-if="!rows.length" class="px-4 py-6 text-center text-caption text-ink-muted">
      No anomalies detected in the current window.
    </div>

    <ul v-else class="divide-y divide-surface-border">
      <li v-for="r in rows" :key="r.id" class="flex items-start gap-3 px-4 py-3">
        <span class="mt-1 h-2 w-2 flex-shrink-0 rounded-full" :class="SEVERITY_META[r.severity].dot" />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <p class="truncate text-body font-medium text-ink">{{ r.type }}</p>
            <span class="text-caption" :class="SEVERITY_META[r.severity].text">
              {{ SEVERITY_META[r.severity].label }}
            </span>
          </div>
          <p class="truncate text-caption text-ink-muted">
            {{ r.route }} · {{ r.enterprise }} — {{ r.detail }}
          </p>
        </div>
        <span class="flex-shrink-0 whitespace-nowrap text-caption text-ink-muted">
          {{ formatRelative(r.ts) }}
        </span>
      </li>
    </ul>
  </div>
</template>
