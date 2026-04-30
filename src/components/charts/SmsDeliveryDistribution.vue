<script setup>
import { computed, ref } from 'vue'
import PlotlyChart from './PlotlyChart.vue'
import { adjustOpacity, PRIMARY_COLOR, monochromeScale } from '@/utils/chartColors'

/**
 * Two-level interactive SMS delivery distribution.
 * Level 1: horizontal bar per telco (Jio, Vi, Airtel, BSNL, Unidentified)
 * Level 2: on telco click → second chart below shows connects under that telco
 */
const props = defineProps({
  operatorTotals: { type: Array, required: true }, // [{ key, label, count, deliveryRate }]
  connectTotals:  { type: Object, required: true }, // { jio: [{key, label, count, deliveryRate}], ... }
  height:         { type: [String, Number], default: 260 },
})

const selectedTelco = ref(null)

function clearSelection() {
  selectedTelco.value = null
}

// ── Level 1 — telco bars ──────────────────────────────────────────────────
const telcoTotal = computed(() =>
  props.operatorTotals.reduce((a, op) => a + (op.count || 0), 0) || 1,
)

const telcoTraces = computed(() => {
  const ops = [...props.operatorTotals].sort((a, b) => (b.count || 0) - (a.count || 0))
  const total = telcoTotal.value

  return [
    {
      type: 'bar',
      orientation: 'h',
      y: ops.map((op) => op.label),
      x: ops.map((op) => op.count || 0),
      marker: {
        color: ops.map((op) =>
          selectedTelco.value === op.key ? PRIMARY_COLOR : adjustOpacity(PRIMARY_COLOR, 0.55),
        ),
        line: { width: 0 },
      },
      customdata: ops.map((op) => {
        const pct = ((op.count || 0) / total * 100).toFixed(1)
        const dr = (op.deliveryRate || 0).toFixed(1)
        return [pct, dr, op.key]
      }),
      text: ops.map((op) => `${((op.count || 0) / total * 100).toFixed(1)}%`),
      textposition: 'outside',
      textfont: { size: 11, color: '#475467' },
      hovertemplate: '<b>%{y}</b><br>%{x:,.0f} delivered (%{customdata[0]}%)<br>Delivery rate: %{customdata[1]}%<extra></extra>',
    },
  ]
})

const telcoLayout = computed(() => ({
  showlegend: false,
  margin: { l: 100, r: 72, t: 8, b: 28 },
  xaxis: { tickformat: ',d' },
  yaxis: { automargin: true },
  bargap: 0.3,
}))

// ── Level 2 — connect bars ────────────────────────────────────────────────
const selectedConnects = computed(() => {
  if (!selectedTelco.value) return []
  return props.connectTotals[selectedTelco.value] || []
})

const connectTraces = computed(() => {
  const connects = [...selectedConnects.value].sort((a, b) => (b.count || 0) - (a.count || 0))
  if (connects.length === 0) return []
  const total = connects.reduce((a, c) => a + (c.count || 0), 0) || 1

  return [
    {
      type: 'bar',
      orientation: 'h',
      y: connects.map((c) => c.label),
      x: connects.map((c) => c.count || 0),
      marker: {
        color: connects.map((_, i) => monochromeScale[Math.min(i, monochromeScale.length - 1)]),
        line: { width: 0 },
      },
      customdata: connects.map((c) => {
        const pct = ((c.count || 0) / total * 100).toFixed(1)
        const dr = (c.deliveryRate || 0).toFixed(1)
        return [pct, dr]
      }),
      text: connects.map((c) => `${((c.count || 0) / total * 100).toFixed(1)}%`),
      textposition: 'outside',
      textfont: { size: 11, color: '#475467' },
      hovertemplate: '<b>%{y}</b><br>%{x:,.0f} delivered (%{customdata[0]}%)<br>Delivery rate: %{customdata[1]}%<extra></extra>',
    },
  ]
})

const connectLayout = computed(() => ({
  showlegend: false,
  margin: { l: 140, r: 72, t: 8, b: 28 },
  xaxis: { tickformat: ',d' },
  yaxis: { automargin: true },
  bargap: 0.3,
}))

const connectChartHeight = computed(() => {
  const n = selectedConnects.value.length
  return Math.max(120, n * 52 + 48)
})

const selectedTelcoLabel = computed(() => {
  if (!selectedTelco.value) return ''
  return props.operatorTotals.find((op) => op.key === selectedTelco.value)?.label || selectedTelco.value
})

// Handle Plotly click events from the telco chart.
function onTelcoClick(evt) {
  const point = evt?.points?.[0]
  if (!point) return
  // customdata[2] is the operator key.
  const key = point.customdata?.[2]
  if (!key) return
  const connects = props.connectTotals[key] || []
  if (connects.length === 0) return
  selectedTelco.value = selectedTelco.value === key ? null : key
}
</script>

<template>
  <div class="space-y-4">
    <!-- Level 1: Telco chart -->
    <PlotlyChart
      :data="telcoTraces"
      :layout="telcoLayout"
      :height="height"
      @plotly-click="onTelcoClick"
      style="cursor: pointer"
    />

    <!-- Level 2: Connect drill-down -->
    <transition name="slide-down">
      <div v-if="selectedTelco && selectedConnects.length > 0" class="rounded-large border border-surface-border bg-surface-muted/50 p-4">
        <div class="mb-3 flex items-center justify-between">
          <div>
            <p class="text-body font-semibold text-ink">{{ selectedTelcoLabel }} — Connect breakdown</p>
            <p class="text-caption text-ink-muted">Delivered messages per connect under {{ selectedTelcoLabel }}</p>
          </div>
          <button
            @click="clearSelection"
            class="flex items-center gap-1.5 rounded-md px-2 py-1 text-caption text-ink-muted hover:bg-surface-border hover:text-ink"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>
        <PlotlyChart
          :data="connectTraces"
          :layout="connectLayout"
          :height="connectChartHeight"
        />
      </div>
    </transition>

    <!-- Hint text when no telco is selected and connects exist -->
    <p
      v-if="!selectedTelco"
      class="text-center text-caption text-ink-subtle"
    >
      Click a telco bar to drill down into its connect-level breakdown
    </p>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
