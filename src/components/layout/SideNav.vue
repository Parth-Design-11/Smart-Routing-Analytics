<script setup>
import { useRoute } from 'vue-router'

import DashboardIcon from '../../../icons/Dashboard.png'
import EnterprisesIcon from '../../../icons/Enterprises.png'
import ChannelsIcon from '../../../icons/Channels.png'
import TemplatesIcon from '../../../icons/Templates.png'
import APIIcon from '../../../icons/API.png'
import RoutesIcon from '../../../icons/Routes.png'
import SSOTIcon from '../../../icons/SSOT.png'
import SettingsIcon from '../../../icons/Settings.png'
import HelpIcon from '../../../icons/Help.png'

const route = useRoute()

const primaryItems = [
  { name: 'Dashboard', icon: DashboardIcon },
  { name: 'Enterprises', icon: EnterprisesIcon },
  { name: 'Channels', icon: ChannelsIcon },
  { name: 'Templates', icon: TemplatesIcon },
  { name: 'API', icon: APIIcon },
  { name: 'Routes', icon: RoutesIcon, path: '/routes', activeFor: ['/routes', '/analytics'] },
  { name: 'SSOT', icon: SSOTIcon },
]

const secondaryItems = [
  { name: 'Settings', icon: SettingsIcon },
  { name: 'Help', icon: HelpIcon },
]

function isActive(item) {
  if (!item.path) return false
  if (item.activeFor) {
    return item.activeFor.some((p) => route.path.startsWith(p))
  }
  return route.path.startsWith(item.path)
}
</script>

<template>
  <aside class="flex h-full w-sidenav shrink-0 flex-col justify-between bg-sidenav text-white">
    <div>
      <!-- Logo -->
      <div class="flex items-center justify-center py-4">
        <div
          class="flex h-8 w-8 items-center justify-center rounded text-xl font-bold text-brand-blue"
        >
          W
        </div>
      </div>

      <!-- Primary nav -->
      <nav class="flex flex-col items-center gap-1 px-1.5 pt-3">
        <router-link
          v-for="item in primaryItems"
          :key="item.name"
          :to="item.path || '#'"
          class="group flex w-full flex-col items-center gap-1 rounded-std px-1 py-2 transition-colors"
          :class="[
            isActive(item)
              ? 'bg-sidenav-active text-white'
              : 'text-white/85 hover:bg-white/5',
          ]"
          :event="item.path ? 'click' : ''"
        >
          <img :src="item.icon" :alt="item.name" class="h-5 w-5" />
          <span class="text-[10px] leading-3 tracking-[0.1px]">{{ item.name }}</span>
        </router-link>
      </nav>
    </div>

    <!-- Secondary nav (Settings / Help) -->
    <nav class="flex flex-col items-center gap-1 px-1.5 pb-4">
      <button
        v-for="item in secondaryItems"
        :key="item.name"
        class="flex w-full flex-col items-center gap-1 rounded-std px-1 py-2 text-white/85 transition-colors hover:bg-white/5"
      >
        <img :src="item.icon" :alt="item.name" class="h-5 w-5" />
        <span class="text-[10px] leading-3 tracking-[0.1px]">{{ item.name }}</span>
      </button>
    </nav>
  </aside>
</template>
