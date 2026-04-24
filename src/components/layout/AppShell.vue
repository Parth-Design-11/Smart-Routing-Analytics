<script setup>
import SideNav from './SideNav.vue'
import TopBar from './TopBar.vue'
</script>

<template>
  <div class="flex h-full w-full bg-topbar">
    <SideNav />
    <div class="flex flex-1 min-w-0 flex-col">
      <TopBar />
      <main class="flex-1 min-h-0 overflow-auto p-4">
        <div class="card min-h-full p-6">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
