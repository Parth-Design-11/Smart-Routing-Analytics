<script setup>
import { computed } from 'vue'
import ChannelPill from '@/components/ui/ChannelPill.vue'
import { ROUTE_TYPE_META } from '@/mock/routes'
import { getSendersForRoute, getTemplatesForRoute } from '@/mock/senders'

const props = defineProps({
  route: { type: Object, required: true },
})

const priority = computed(() =>
  props.route.priority || ROUTE_TYPE_META[props.route.type].channels,
)

const senders = computed(() => getSendersForRoute(props.route))
const templates = computed(() => getTemplatesForRoute(props.route))
const activeTemplates = computed(() => templates.value.filter((t) => t.active).length)
const inactiveTemplates = computed(() => templates.value.length - activeTemplates.value)
</script>

<template>
  <div class="card p-4">
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-sub-heading text-ink">Route configuration</h3>
      <button class="btn-secondary !py-1.5 !px-3">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
          <path d="M18.4 2.6a2 2 0 0 1 2.8 2.8L12 14.5 8 15l.5-4 10-8.4Z" />
        </svg>
        Edit route
      </button>
    </div>

    <dl class="grid grid-cols-1 gap-4 text-caption sm:grid-cols-3">
      <div>
        <dt class="text-ink-muted">Enterprise</dt>
        <dd class="text-body font-medium text-ink">{{ route.enterprise }}</dd>
      </div>
      <div>
        <dt class="text-ink-muted">SMPP account</dt>
        <dd class="text-body font-medium text-ink">{{ route.smppAccount }}</dd>
      </div>
      <div>
        <dt class="text-ink-muted">Route type</dt>
        <dd class="text-body font-medium text-ink">{{ ROUTE_TYPE_META[route.type]?.label }}</dd>
      </div>

      <div class="sm:col-span-3">
        <dt class="mb-1 text-ink-muted">Channel priority (primary → fallback)</dt>
        <dd class="flex flex-wrap items-center gap-1.5">
          <template v-for="(ch, i) in priority" :key="ch">
            <ChannelPill :channel="ch" />
            <svg
              v-if="i < priority.length - 1"
              class="h-3 w-3 text-ink-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </template>
        </dd>
      </div>

      <div>
        <dt class="text-ink-muted">Sender IDs</dt>
        <dd class="flex flex-wrap gap-1">
          <span
            v-for="s in senders"
            :key="s"
            class="rounded-std bg-surface-muted px-1.5 py-0.5 font-mono text-caption text-ink-subtle"
          >
            {{ s }}
          </span>
        </dd>
      </div>
      <div>
        <dt class="text-ink-muted">Templates</dt>
        <dd class="text-body text-ink">
          {{ activeTemplates }} active
          <span v-if="inactiveTemplates > 0" class="text-warning-text">
            · {{ inactiveTemplates }} inactive
          </span>
        </dd>
      </div>
      <div>
        <dt class="text-ink-muted">Created / Last modified</dt>
        <dd class="text-body text-ink">
          {{ route.createdOn }} · <span class="text-ink-muted">{{ route.lastModified }}</span>
        </dd>
      </div>
    </dl>
  </div>
</template>
