# Smart Routing — Analytics Screens Plan

## Context
The CPaaS Smart Routing product lets aggregators define routes that send SMS traffic to SMS, Google RCS, TrueCaller, or multi-channel combinations (with SMS as the default fallback). Route creation flows already exist; analytics does not.

We need to design + prototype two analytics surfaces:
- **Part 1 — Overall analytics** across all routes (portfolio-level view for an aggregator admin).
- **Part 2 — Route-level analytics** (deep dive into a single route).

Persona is the **aggregator admin** optimizing delivery performance and channel mix. Scope is **delivery/performance metrics only** (no commercial/cost metrics in this iteration). Time horizon is **historical with a date-range picker** (24h / 7d / 30d / 90d / custom). Tech stack is **Vue 3 + Vite + Plotly.js** (Vue wrapper `vue-plotly.js` or direct Plotly). The user will provide the base route-listing screen and the navigation entry point into analytics; this plan does not rebuild those.

The deliverable has two phases: **Phase 1 — metric ideation + edge cases** (this document); **Phase 2 — functional Vue prototype with mock data**.

---

## Phase 1 — Metric Ideation

### Part 1: Overall Analytics (portfolio view)

**Global filters (sticky header)**
- Date-range picker: 24h, 7d, 30d, 90d, custom
- Enterprise multi-select
- Channel filter (SMS / RCS / TrueCaller / Multi-channel)
- Route-type filter (SMS-only, RCS+SMS, TrueCaller+SMS, Multi-channel)
- "Compare to previous period" toggle
- Last-updated timestamp + refresh

**KPI cards (top row, with Δ vs previous period)**
1. Total messages submitted
2. Overall delivery rate %
3. Fallback rate % (non-SMS attempts that fell back to SMS)
4. Avg end-to-end delivery latency
5. Active routes count

**Charts**
- **Volume trend** — stacked area, split by channel (SMS / RCS / TrueCaller), x-axis = time, bucketed by range
- **Delivery rate trend** — multi-line, one line per channel
- **Channel attempt mix** — donut: % of attempts per channel
- **Delivery funnel** — Submitted → Attempted on primary → Delivered on primary → Fallback triggered → Final delivered
- **Route-type distribution** — donut: SMS-only / RCS+SMS / TrueCaller+SMS / Multi-channel
- **Failure reason breakdown** — horizontal bar (Handset unreachable, DND, Operator rejection, Inactive template, Agent not found, etc.)
- **Operator × channel delivery heatmap** — delivery % per operator (Airtel/Jio/Vi/BSNL) × channel
- **Geographic heatmap** (stretch) — India map, delivery % by circle/state

**Tables**
- **Route leaderboard** — sortable: Route | Enterprise | Type | Volume | Delivery % | Fallback % | Avg latency | Status | Trend sparkline
- **Underperforming routes** — auto-flagged routes where delivery dropped > X% vs previous period, or absolute delivery < threshold
- **Recent anomalies** — flagged events (delivery drop, latency spike, fallback surge)

---

### Part 2: Route-Level Analytics (single route)

**Header**
- Route name + status pill (Active / Paused)
- "Edit route" button + breadcrumb back to listing
- Route-config summary card: Enterprise, Sources (SMPP/Access list), Channel priority order (visual chain), Sender mode, Template mode
- Same date-range picker + "Compare to previous period"

**KPI cards**
1. Messages submitted
2. Delivery rate (with Δ)
3. Fallback triggered % (hidden if single-channel SMS)
4. Avg latency (per-channel chips)
5. Active templates in route (count + link to template list)

**Charts — adaptive to route type**
- **Route flow Sankey** (hero viz) — visualises delivery across the route end-to-end. Nodes: Submitted → each configured channel (Priority 1, 2, SMS fallback) → Delivered / Failed → Failure reason buckets. Band widths scale with message volume. Hovering a band shows count + %. Adapts to route type (SMS-only routes collapse to a simpler 3-node flow; multi-channel routes show the full priority chain)
- **Volume over time** by channel
- **Delivery funnel** — adapts to route config:
  - *SMS-only*: Submitted → Routed to operator → Delivered
  - *RCS + SMS*: Submitted → Agent matched → RCS sent → RCS delivered → RCS read / RCS failed → SMS fallback → SMS delivered
  - *TrueCaller + SMS*: Submitted → VMN matched → TC sent → TC delivered → TC failed → SMS fallback → SMS delivered
  - *Multi-channel*: Priority 1 attempt → delivered / failed → Priority 2 attempt → delivered / failed → SMS fallback → delivered
- **Priority performance** — stacked bar: % delivered at priority 1 vs priority 2 vs SMS fallback (multi-channel only)
- **Operator split** — donut for SMS fallback / SMS-only
- **Sender × Template performance matrix** — heatmap: rows=Sender IDs, cols=Templates, color=delivery %
- **Failure reasons** — horizontal bar
- **Latency distribution** — histogram

**Tables**
- **Sender-Template breakdown** — Sender ID | Template | Volume | Delivery % | Fallback % | Avg latency
- **Recent message sample** (last 20 messages) — Time | Destination (masked) | Attempted channel | Final channel | Status | Latency | Failure reason

---

### Edge Cases (apply to both views)

1. **New route / zero data** — empty state with copy: "No messages routed yet. Traffic will appear here within a few minutes of your first send."
2. **Paused route** — status pill + banner ("Paused on 2026-04-18"); historical data still shown
3. **Single-channel route (SMS-only)** — hide fallback, read-rate, channel-mix widgets; simplified funnel
4. **Fallback never triggered** — collapse fallback segments in funnel; show "100% delivered on primary channel" note
5. **Low volume (<100 msgs)** — inline warning "Low volume — % metrics may be noisy"; hide sparklines with low signal
6. **Very high volume** — abbreviate (1.2M, 450K); down-sample charts
7. **Zero messages in selected range** — empty chart placeholders with "No data for this time range — try a wider range"
8. **Route config changed mid-period** — banner "Route config changed on DATE — metrics before/after this date may not be comparable" with a divider marker on time-series charts
9. **All channels failing / 0% delivery** — red incident banner at top; highlight failure-reason chart
10. **Inactive template in route** — banner "N template(s) in this route are currently inactive — messages using them will fail"; surface inactive-template failures as a distinct failure reason with a link to the template list
11. **Loading state** — skeleton cards + chart shimmers
12. **Error state** — chart-level error with retry
13. **Long route or enterprise names** — truncate with tooltip
14. **Compare-to-previous toggle** with no data in prior period — gray out Δ, show "No prior data"
15. **Responsive / tablet** — KPI row wraps; charts stack 1-col below 1024px
16. **Accessibility** — color palette must distinguish channels for color-blind users; every chart has a data-table toggle
17. **Filter returns empty set** — global empty state with "Clear filters" CTA

---

## Phase 2 — Functional Prototype (Plan)

### Sub-phase breakdown
Phase 2 is split into 4 sequential sub-phases. User provides Figma context for 2.1, 2.2, 2.3 via the `figma-console` MCP server.

- **Phase 2.0 — Foundation scaffold** (no Figma needed) — ✅ DONE
  - Vite + Vue 3 + Tailwind + Plotly + Pinia + Router project setup
  - AppShell layout + base UI components (KpiCard, DateRangePicker, FilterBar, EmptyState, Skeleton, StatusPill, DataTable)
  - `PlotlyChart.vue` base wrapper
  - Full mock-data module: routes, generators, edge-case fixtures
  - Minimal placeholder views wired into the router so `npm run dev` boots cleanly
- **Phase 2.1 — Route listing screen** (needs Figma) — ✅ DONE (initial pass, Figma-matched)
  - Replace placeholder listing with Figma-matched implementation
  - Each of the 12–15 mock routes (including all edge-case routes) clickable into `/routes/:id/analytics`
  - Entry point into `/analytics` (overall)
- **Phase 2.2 — Overall Analytics tab** (needs Figma) — ⏳ NEXT
  - Build `OverallAnalytics.vue` to match Figma
  - All KPI cards, charts, and tables from Phase 1 ideation
  - Edge cases built within this sub-phase: zero data, filter-returns-empty, compare-period-no-prior-data, loading, error
- **Phase 2.3 — Route-level Analytics** (needs Figma)
  - Build `RouteAnalytics.vue` to match Figma
  - Route Flow Sankey as hero viz + all adaptive charts per route type
  - Edge cases built within this sub-phase: new/empty route, paused route, single-channel SMS, fallback-never-triggered, low-volume, very high volume, 0% delivery, config-changed mid-period, inactive-template route

### Gating rule
Do not begin 2.1/2.2/2.3 until Figma is available for that sub-phase. Each sub-phase ends with a visual validation pass using `figma-console` screenshots vs. the running app.

### Tech stack
- **Vue 3** (Composition API, `<script setup>`) + **Vite**
- **Vue Router** for navigation
- **Plotly.js** (`plotly.js-dist-min`) wrapped in a small `PlotlyChart.vue` component — avoids a heavy third-party wrapper, gives full Plotly API access
- **Tailwind CSS** for layout + utility styling
- **Pinia** for lightweight state (filters, mock dataset)
- **No backend** — all data from a mock-data module

### Folder structure
```
Smart Routing/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── PLAN.md
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── style.css
│   ├── router/index.js
│   ├── stores/
│   │   └── filters.js          # date range, enterprise, channel filters
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.vue    # sidebar + topbar
│   │   │   ├── SideNav.vue     # dark 80px nav
│   │   │   ├── TopBar.vue      # 56px topbar (HDFC lockup + division pill + avatar)
│   │   │   └── PageHeader.vue  # title + horizontal tabs (Routes / Analytics)
│   │   ├── ui/
│   │   │   ├── KpiCard.vue
│   │   │   ├── DateRangePicker.vue
│   │   │   ├── FilterBar.vue
│   │   │   ├── StatusPill.vue
│   │   │   ├── ChannelPill.vue
│   │   │   ├── ChannelStack.vue
│   │   │   ├── Toggle.vue
│   │   │   ├── SearchInput.vue
│   │   │   ├── SelectInput.vue
│   │   │   ├── EmptyState.vue
│   │   │   ├── Skeleton.vue
│   │   │   └── DataTable.vue
│   │   ├── charts/
│   │   │   ├── PlotlyChart.vue       # base wrapper
│   │   │   ├── VolumeTrend.vue
│   │   │   ├── DeliveryRateTrend.vue
│   │   │   ├── ChannelMixDonut.vue
│   │   │   ├── DeliveryFunnel.vue
│   │   │   ├── RouteFlowSankey.vue   # hero viz on route page
│   │   │   ├── FailureReasonsBar.vue
│   │   │   ├── OperatorHeatmap.vue
│   │   │   ├── PriorityPerformance.vue
│   │   │   ├── SenderTemplateMatrix.vue
│   │   │   └── LatencyHistogram.vue
│   │   └── analytics/
│   │       ├── RouteLeaderboard.vue
│   │       ├── UnderperformingRoutes.vue
│   │       ├── RouteConfigSummary.vue
│   │       └── MessageSampleTable.vue
│   ├── views/
│   │   ├── RouteListing.vue          # Phase 2.1
│   │   ├── OverallAnalytics.vue      # Phase 2.2
│   │   └── RouteAnalytics.vue        # Phase 2.3
│   ├── utils/
│   │   ├── format.js
│   │   └── dateRange.js
│   └── mock/
│       ├── routes.js                 # 14 mock routes
│       ├── generateMetrics.js        # deterministic metric generator
│       ├── failureReasons.js
│       ├── senders.js
│       ├── prng.js
│       └── edgeCaseRoutes.js
```

### Mock data strategy
- Generate **~14 routes** covering all 4 route types (SMS-only, RCS+SMS, TC+SMS, Multi-channel) across 4 enterprises (HDFC Cards, Dream 11, ICICI, Flipkart).
- Deterministic generator seeded by `routeId` + `dateRange` so values are stable per filter selection.
- Dedicated fixtures for edge-case routes (zero-data, paused, low-volume, 0% delivery, config-changed mid-period, route-with-inactive-template) so every edge case is reachable in the prototype.
- Metrics generator produces: daily buckets of { submitted, channel attempts, deliveries, fallbacks, failures by reason, latency samples, operator split, sender×template matrix, latency histogram }.

### Routing
- `/` → redirects to `/routes`
- `/routes` → Route listing (Phase 2.1)
- `/analytics` → Overall analytics (Phase 2.2)
- `/routes/:id/analytics` → Route-level analytics (Phase 2.3)

### Critical files
- `src/components/charts/PlotlyChart.vue` — single source of truth for Plotly config (theme, layout defaults, responsive resize)
- `src/views/OverallAnalytics.vue` — Phase 2.2 page composition
- `src/views/RouteAnalytics.vue` — Phase 2.3 page; renders adaptive funnel and Sankey based on route type
- `src/mock/generateMetrics.js` — needs to produce realistic, correlated numbers (e.g., fallback % + primary failure % should reconcile)
- `src/stores/filters.js` — filter state shared between views
- `tailwind.config.js` — design tokens

### Verification (end-to-end)
- `npm install && npm run dev` → app boots on `http://localhost:5173` (or next free port)
- From listing, click `/analytics` → verify all KPIs, charts, tables render with mock data; toggle date range; toggle compare-period; filter by enterprise/channel
- From listing, click into a **normal multi-channel route** → verify adaptive funnel shows priority 1 → priority 2 → fallback segments; verify all charts populate
- Click into each **edge-case route** in turn: new/empty, paused, single-channel SMS-only, low-volume, all-failing, config-changed mid-period, route-with-inactive-template — verify correct empty/banner/simplified states for each
- Resize to tablet width (1024px) and phone width (375px) — verify layout reflow
- Toggle a Plotly chart's hover tooltip to confirm interactivity

---

## Design tokens (extracted from Figma)

| Token                | Value      | Usage                          |
| -------------------- | ---------- | ------------------------------ |
| Sidenav bg           | `#182230`  | Dark left rail                 |
| Sidenav active       | `#3d6ede`  | Selected nav item              |
| Topbar bg            | `#f0f2f5`  | App chrome                     |
| Topbar pill          | `#ebedef`  | Division / icon buttons        |
| Topbar pill border   | `#e3e5e7`  | Division / icon buttons        |
| Brand blue           | `#1c73e8`  | Primary CTAs, active tab       |
| Ink                  | `#101828`  | Primary text                   |
| Ink muted            | `#667085`  | Secondary / inactive text      |
| Success              | `#15be53`  | Toggles, positive deltas       |
| Danger               | `#d92d20`  | Errors, negative deltas        |
| Channel — SMS        | `#1570ef`  | Chart fills, pills             |
| Channel — RCS        | `#7839ee`  | Chart fills, pills             |
| Channel — TrueCaller | `#12b76a`  | Chart fills, pills             |
| Channel — Fallback   | `#667085`  | SMS fallback bands             |

Typography: Inter 300/400/500/600/700. Tab labels 14px Semi Bold. Page title 24px Semi Bold.
