<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useFiltersStore } from '@/stores/filters'

const store = useFiltersStore()

const isOpen = ref(false)
const triggerRef = ref(null)

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const presets = [
  { label: 'Today',        value: 'today' },
  { label: 'Yesterday',    value: 'yesterday' },
  { label: 'Last 7 days',  value: '7d' },
  { label: 'Last 15 days', value: '15d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Custom',       value: 'custom' },
]

// Which preset is currently highlighted in the open dropdown
const tempPreset = ref(store.dateRange === 'custom' ? 'custom' : store.dateRange)

// Calendar months (left/right panels, always 1 apart)
// Default: left = March 2026, right = April 2026 (based on REFERENCE_DATE)
const leftYear  = ref(2026)
const leftMonth = ref(2) // 0-indexed: 2 = March
const rightYear  = ref(2026)
const rightMonth = ref(3) // 0-indexed: 3 = April

// Custom range selection state
const rangeStart  = ref(store.customStart || null)
const rangeEnd    = ref(store.customEnd   || null)
const hoverDate   = ref(null)
const selecting   = ref(false) // true = first click done, waiting for end

// ---- trigger label ----
const triggerLabel = computed(() => {
  if (store.dateRange === 'custom' && store.customStart && store.customEnd) {
    return `${fmt(store.customStart)} – ${fmt(store.customEnd)}`
  }
  return presets.find((p) => p.value === store.dateRange)?.label ?? store.dateRange
})

function fmt(iso) {
  // YYYY-MM-DD → DD MMM YYYY
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d} ${MONTH_NAMES[+m - 1].slice(0, 3)} ${y}`
}

// ---- calendar helpers ----
function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate()
}
function firstWeekdayOfMonth(y, m) {
  // Returns 0=Mon…6=Sun
  const raw = new Date(y, m, 1).getDay()
  return (raw + 6) % 7
}
function dateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function buildGrid(y, m) {
  const cells = []
  const total = daysInMonth(y, m)
  const offset = firstWeekdayOfMonth(y, m)
  const pm = m === 0 ? 11 : m - 1
  const py = m === 0 ? y - 1 : y
  const pdTotal = daysInMonth(py, pm)
  for (let i = offset - 1; i >= 0; i--) {
    cells.push({ d: pdTotal - i, m: pm, y: py, out: true })
  }
  for (let d = 1; d <= total; d++) {
    cells.push({ d, m, y, out: false })
  }
  const nm = m === 11 ? 0 : m + 1
  const ny = m === 11 ? y + 1 : y
  let nd = 1
  while (cells.length < 42) cells.push({ d: nd++, m: nm, y: ny, out: true })
  return cells
}

const leftGrid  = computed(() => buildGrid(leftYear.value,  leftMonth.value))
const rightGrid = computed(() => buildGrid(rightYear.value, rightMonth.value))

function effectiveEnd() {
  if (rangeEnd.value) return rangeEnd.value
  if (selecting.value && hoverDate.value) return hoverDate.value
  return null
}
function cellState(cell) {
  if (cell.out) return 'out'
  const d = dateStr(cell.y, cell.m, cell.d)
  const s = rangeStart.value
  const e = effectiveEnd()
  if (!s) return 'normal'
  const [lo, hi] = s <= (e ?? s) ? [s, e ?? s] : [e ?? s, s]
  if (d === lo && d === hi) return 'single'
  if (d === lo) return 'start'
  if (d === hi) return 'end'
  if (d > lo && d < hi) return 'range'
  return 'normal'
}

// ---- navigation ----
function prevMonth() {
  if (leftMonth.value === 0)  { leftMonth.value = 11; leftYear.value-- }
  else leftMonth.value--
  if (rightMonth.value === 0) { rightMonth.value = 11; rightYear.value-- }
  else rightMonth.value--
}
function nextMonth() {
  if (rightMonth.value === 11) { rightMonth.value = 0; rightYear.value++ }
  else rightMonth.value++
  if (leftMonth.value === 11)  { leftMonth.value = 0; leftYear.value++ }
  else leftMonth.value++
}

// ---- interactions ----
function onDayClick(cell) {
  if (cell.out) return
  const d = dateStr(cell.y, cell.m, cell.d)
  if (!selecting.value) {
    rangeStart.value = d
    rangeEnd.value   = null
    selecting.value  = true
  } else {
    if (d < rangeStart.value) {
      rangeEnd.value   = rangeStart.value
      rangeStart.value = d
    } else {
      rangeEnd.value = d
    }
    selecting.value = false
    hoverDate.value = null
  }
}
function onDayHover(cell) {
  if (selecting.value && !cell.out) hoverDate.value = dateStr(cell.y, cell.m, cell.d)
}

function selectPreset(value) {
  tempPreset.value = value
  if (value !== 'custom') {
    store.setDateRange(value)
    isOpen.value = false
  } else {
    // Reset selection if switching to custom
    selecting.value = false
  }
}

function applyCustom() {
  if (rangeStart.value && rangeEnd.value) {
    store.setCustomRange(rangeStart.value, rangeEnd.value)
    isOpen.value = false
  }
}
function cancelCustom() {
  isOpen.value  = false
  tempPreset.value = store.dateRange === 'custom' ? 'custom' : store.dateRange
  rangeStart.value = store.customStart || null
  rangeEnd.value   = store.customEnd   || null
  selecting.value  = false
  hoverDate.value  = null
}

function openDropdown() {
  tempPreset.value = store.dateRange === 'custom' ? 'custom' : store.dateRange
  rangeStart.value = store.customStart || null
  rangeEnd.value   = store.customEnd   || null
  selecting.value  = false
  hoverDate.value  = null
  isOpen.value = !isOpen.value
}

// ---- range display label ----
const displayRange = computed(() => {
  const s = rangeStart.value
  const e = rangeEnd.value || (selecting.value && hoverDate.value ? hoverDate.value : null)
  if (!s) return 'Select start date'
  if (!e) return fmt(s) + ' → …'
  const [lo, hi] = s <= e ? [s, e] : [e, s]
  return `${fmt(lo)}  –  ${fmt(hi)}`
})

// ---- click outside ----
function handleOutside(e) {
  if (triggerRef.value && !triggerRef.value.contains(e.target)) {
    isOpen.value = false
  }
}
onMounted(()       => document.addEventListener('mousedown', handleOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleOutside))
</script>

<template>
  <div class="relative" ref="triggerRef">
    <!-- Trigger -->
    <button
      @click="openDropdown"
      class="inline-flex items-center gap-2 rounded-large border border-surface-border bg-surface px-3 py-1.5 text-button-sm font-medium text-ink transition-colors hover:border-brand-blue"
      :class="isOpen ? 'border-brand-blue' : ''"
    >
      <svg class="h-4 w-4 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <span>{{ triggerLabel }}</span>
      <svg class="h-3.5 w-3.5 text-ink-muted transition-transform" :class="isOpen ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </button>

    <!-- Dropdown panel -->
    <div
      v-if="isOpen"
      class="absolute left-0 top-full z-30 mt-1.5 flex overflow-hidden rounded-xl border border-surface-border bg-surface shadow-elevated"
    >
      <!-- Left: preset list -->
      <div class="flex w-40 flex-col gap-0.5 border-r border-surface-border p-2">
        <button
          v-for="p in presets"
          :key="p.value"
          @click="selectPreset(p.value)"
          class="rounded-relaxed px-3 py-2 text-left text-body transition-colors"
          :class="tempPreset === p.value
            ? 'bg-brand-blue-light text-brand-blue-deep font-medium'
            : 'text-ink-muted hover:bg-surface-muted hover:text-ink'"
        >
          {{ p.label }}
        </button>
      </div>

      <!-- Right: dual-month calendar (Custom only) -->
      <div v-if="tempPreset === 'custom'" class="flex flex-col gap-0 p-5">
        <div class="flex gap-8">
          <!-- Left calendar month -->
          <div>
            <div class="mb-3 flex items-center justify-between">
              <button
                @click="prevMonth"
                class="flex h-7 w-7 items-center justify-center rounded-std text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <span class="text-caption font-semibold text-ink">
                {{ MONTH_NAMES[leftMonth] }} {{ leftYear }}
              </span>
              <div class="h-7 w-7" />
            </div>
            <div class="mb-1 grid grid-cols-7">
              <div v-for="lbl in DAY_LABELS" :key="lbl" class="flex h-8 w-8 items-center justify-center text-micro font-medium text-ink-muted">{{ lbl }}</div>
            </div>
            <div class="grid grid-cols-7">
              <button
                v-for="(cell, i) in leftGrid"
                :key="i"
                @click="onDayClick(cell)"
                @mouseover="onDayHover(cell)"
                :disabled="cell.out"
                class="relative flex h-8 w-8 items-center justify-center text-body outline-none transition-colors"
                :class="{
                  'opacity-25 cursor-default': cell.out,
                  'cursor-pointer': !cell.out,
                  'rounded-full bg-brand-blue text-white font-medium z-10': cellState(cell) === 'start' || cellState(cell) === 'end' || cellState(cell) === 'single',
                  'bg-brand-blue-light text-brand-blue-deep': cellState(cell) === 'range',
                  'hover:rounded-full hover:bg-surface-muted text-ink': cellState(cell) === 'normal' && !cell.out,
                }"
              >
                {{ cell.d }}
              </button>
            </div>
          </div>

          <!-- Right calendar month -->
          <div>
            <div class="mb-3 flex items-center justify-between">
              <div class="h-7 w-7" />
              <span class="text-caption font-semibold text-ink">
                {{ MONTH_NAMES[rightMonth] }} {{ rightYear }}
              </span>
              <button
                @click="nextMonth"
                class="flex h-7 w-7 items-center justify-center rounded-std text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
            <div class="mb-1 grid grid-cols-7">
              <div v-for="lbl in DAY_LABELS" :key="lbl" class="flex h-8 w-8 items-center justify-center text-micro font-medium text-ink-muted">{{ lbl }}</div>
            </div>
            <div class="grid grid-cols-7">
              <button
                v-for="(cell, i) in rightGrid"
                :key="i"
                @click="onDayClick(cell)"
                @mouseover="onDayHover(cell)"
                :disabled="cell.out"
                class="relative flex h-8 w-8 items-center justify-center text-body outline-none transition-colors"
                :class="{
                  'opacity-25 cursor-default': cell.out,
                  'cursor-pointer': !cell.out,
                  'rounded-full bg-brand-blue text-white font-medium z-10': cellState(cell) === 'start' || cellState(cell) === 'end' || cellState(cell) === 'single',
                  'bg-brand-blue-light text-brand-blue-deep': cellState(cell) === 'range',
                  'hover:rounded-full hover:bg-surface-muted text-ink': cellState(cell) === 'normal' && !cell.out,
                }"
              >
                {{ cell.d }}
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-4 flex items-center justify-between border-t border-surface-border pt-3">
          <span class="font-mono text-caption text-ink-muted">{{ displayRange }}</span>
          <div class="flex items-center gap-2">
            <button @click="cancelCustom" class="btn-secondary px-4 py-1.5 text-body">Cancel</button>
            <button
              @click="applyCustom"
              :disabled="!rangeStart || !rangeEnd"
              class="btn-primary px-4 py-1.5 text-body disabled:cursor-not-allowed disabled:opacity-40"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
