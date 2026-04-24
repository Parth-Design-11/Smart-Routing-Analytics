<script setup></script>

<template>
  <header class="flex h-topbar items-center justify-between bg-topbar px-6">
    <div class="flex items-center gap-3">
      <!-- HDFC Bank brand lockup (approximation of the Figma image asset) -->
      <div
        class="flex h-8 items-center gap-2 rounded bg-white px-2 shadow-ambient"
      >
        <div
          class="flex h-5 w-5 items-center justify-center rounded-sm bg-danger text-[10px] font-bold text-white"
        >
          +
        </div>
        <span class="text-[13px] font-bold tracking-wide text-[#003a7a]">
          HDFC BANK
        </span>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        class="flex h-9 items-center gap-1 rounded-large border border-topbar-pill-border bg-topbar-pill px-3 text-[12px] font-medium tracking-wide text-ink"
      >
        CREDIT CARD DIVISION
        <svg class="h-4 w-4 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <button
        class="relative flex h-9 w-9 items-center justify-center rounded-large border border-topbar-pill-border bg-topbar-pill text-ink"
        aria-label="Notifications"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-5-5.9V4a1 1 0 1 0-2 0v1.1A6 6 0 0 0 6 11v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0" />
        </svg>
        <span class="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-topbar-pill" />
      </button>
      <div
        class="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-brand-blue to-channel-rcs ring-1 ring-black/5"
        aria-label="User avatar"
      />
    </div>
  </header>
</template>
