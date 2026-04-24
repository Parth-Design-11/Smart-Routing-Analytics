<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/layout/PageHeader.vue'
import DataTable from '@/components/ui/DataTable.vue'
import ChannelPill from '@/components/ui/ChannelPill.vue'
import ChannelStack from '@/components/ui/ChannelStack.vue'
import Toggle from '@/components/ui/Toggle.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import { getDefaultRoute, getSmartRoutes, ENTERPRISES, CHANNEL_TYPES } from '@/mock/routes'
import { formatDate } from '@/utils/format'

const router = useRouter()

const defaultRoute = ref(getDefaultRoute())
const smartRoutes = ref(getSmartRoutes())

const search = ref('')
const enterprise = ref('all')
const channel = ref('all')

const enterpriseOptions = [
  { label: 'All', value: 'all' },
  ...ENTERPRISES.map((e) => ({ label: e, value: e })),
]
const channelOptions = [
  { label: 'All', value: 'all' },
  ...CHANNEL_TYPES.map((c) => ({ label: c.label, value: c.value })),
]

const filtered = computed(() =>
  smartRoutes.value.filter((r) => {
    if (search.value && !r.name.toLowerCase().includes(search.value.toLowerCase())) return false
    if (enterprise.value !== 'all' && r.enterprise !== enterprise.value) return false
    if (channel.value !== 'all' && !r.channels.includes(channel.value)) return false
    return true
  }),
)

const tabs = [
  { label: 'Routes', to: '/routes' },
  { label: 'Analytics', to: '/analytics' },
]

const defaultColumns = [
  { key: 'name', label: 'Route Name' },
  { key: 'channels', label: 'Delivery Channel' },
  { key: 'createdOn', label: 'Created on' },
  { key: 'lastModified', label: 'Last Modified' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

const smartColumns = [
  { key: 'name', label: 'Route Name' },
  { key: 'enterprise', label: 'Enterprise' },
  { key: 'smppAccount', label: 'SMPP Account' },
  { key: 'channels', label: 'Delivery Channel' },
  { key: 'createdOn', label: 'Created on' },
  { key: 'lastModified', label: 'Last Modified' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

function openAnalytics(route) {
  router.push({ name: 'route-analytics', params: { id: route.id } })
}

function toggleStatus(row) {
  row.status = row.status === 'active' ? 'paused' : 'active'
}

const activeMenuId = ref(null)
const menuPos = ref({ top: 0, left: 0 })

function toggleMenu(id, event) {
  if (activeMenuId.value === id) {
    activeMenuId.value = null
    return
  }
  const rect = event.currentTarget.getBoundingClientRect()
  menuPos.value = { top: rect.bottom + 4, left: rect.right - 160 }
  activeMenuId.value = id
}

function closeMenu() {
  activeMenuId.value = null
}
</script>

<template>
  <div class="space-y-6" @click="closeMenu">
    <PageHeader title="Smart Routing" :tabs="tabs" />

    <!-- Default route section -->
    <section>
      <DataTable :columns="defaultColumns" :rows="[defaultRoute]" row-key="id">
        <template #cell-channels="{ row }">
          <ChannelPill :channel="row.channels[0]" />
        </template>
        <template #cell-createdOn="{ row }">
          {{ formatDate(row.createdOn) }}
        </template>
        <template #cell-lastModified="{ row }">
          {{ formatDate(row.lastModified) }}
        </template>
        <template #cell-status="{ row }">
          <Toggle :model-value="row.status === 'active'" @update:model-value="toggleStatus(row)" />
        </template>
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <button class="btn-secondary !py-1.5 !px-3" @click="openAnalytics(row)">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3v18h18M7 14l4-4 4 4 5-5" />
              </svg>
              View Analytics
            </button>
            <button class="btn-ghost !p-2" title="More" @click.stop="toggleMenu(row.id, $event)">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </div>
        </template>
      </DataTable>
    </section>

    <!-- Smart route section -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-section-heading text-ink">Smart route</h2>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="max-w-sm flex-1">
          <SearchInput v-model="search" placeholder="Search by route name" />
        </div>
        <div class="flex items-center gap-3">
          <SelectInput label="Enterprise" v-model="enterprise" :options="enterpriseOptions" />
          <SelectInput label="Channel" v-model="channel" :options="channelOptions" />
          <button class="btn-primary">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Route
          </button>
        </div>
      </div>

      <DataTable :columns="smartColumns" :rows="filtered" row-key="id">
        <template #cell-channels="{ row }">
          <ChannelStack :channels="row.channels" />
        </template>
        <template #cell-createdOn="{ row }">
          {{ formatDate(row.createdOn) }}
        </template>
        <template #cell-lastModified="{ row }">
          {{ formatDate(row.lastModified) }}
        </template>
        <template #cell-status="{ row }">
          <Toggle :model-value="row.status === 'active'" @update:model-value="toggleStatus(row)" />
        </template>
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <button class="btn-secondary !py-1.5 !px-3" @click="openAnalytics(row)">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3v18h18M7 14l4-4 4 4 5-5" />
              </svg>
              View Analytics
            </button>
            <button class="btn-ghost !p-2" title="More" @click.stop="toggleMenu(row.id, $event)">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </div>
        </template>
      </DataTable>
    </section>

    <!-- Shared dropdown menu (teleported to body to escape overflow-x-auto) -->
    <Teleport to="body">
      <div
        v-if="activeMenuId"
        :style="{ position: 'fixed', top: menuPos.top + 'px', left: menuPos.left + 'px' }"
        class="z-50 w-40 rounded-lg border border-surface-border bg-white py-1 shadow-md"
        @click.stop
      >
        <button class="flex w-full items-center px-3 py-2 text-body text-ink hover:bg-surface-muted" @click="closeMenu()">
          Route Preview
        </button>
        <button class="flex w-full items-center px-3 py-2 text-body text-ink hover:bg-surface-muted" @click="closeMenu()">
          Edit Route
        </button>
      </div>
    </Teleport>
  </div>
</template>
