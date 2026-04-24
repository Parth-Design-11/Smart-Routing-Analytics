// Deterministic metric generator. Seed = routeId + dateRange so values are
// stable across navigation; edge-case routes get special-cased profiles.

import { getBucketTimestamps } from '@/utils/dateRange'
import { FAILURE_REASONS, OPERATORS } from './failureReasons'
import { ROUTE_TYPE_META, getRouteById, getSmartRoutes } from './routes'
import { getSendersForRoute, getTemplatesForRoute } from './senders'
import { hashSeed, mulberry32, seededRandom } from './prng'

// Per-route performance profile. Edge cases override the baseline.
function getProfile(route) {
  const base = {
    baseVolume: 8000,
    deliveryRate: 0.94,
    fallbackRate: 0.18,
    latencyMs: 1850,
  }

  if (route.edgeCase === 'new') {
    return { ...base, baseVolume: 0, deliveryRate: 0, fallbackRate: 0, latencyMs: 0 }
  }
  if (route.edgeCase === 'paused') {
    return { ...base, baseVolume: 2400, deliveryRate: 0.91, fallbackRate: 0.21 }
  }
  if (route.edgeCase === 'low-volume') {
    return { ...base, baseVolume: 55, deliveryRate: 0.82, fallbackRate: 0.31 }
  }
  if (route.edgeCase === 'all-failing') {
    return { ...base, baseVolume: 6500, deliveryRate: 0.02, fallbackRate: 0.92, latencyMs: 8200 }
  }
  if (route.edgeCase === 'config-changed') {
    return { ...base, baseVolume: 9200, deliveryRate: 0.95, fallbackRate: 0.12, latencyMs: 1600 }
  }
  if (route.edgeCase === 'inactive-template') {
    return { ...base, baseVolume: 7100, deliveryRate: 0.78, fallbackRate: 0.28, latencyMs: 2100 }
  }

  // Default variation per route id.
  const rand = seededRandom(route.id)
  return {
    ...base,
    baseVolume: Math.round(base.baseVolume * (0.6 + rand() * 1.4)),
    deliveryRate: 0.88 + rand() * 0.1,
    fallbackRate: 0.08 + rand() * 0.28,
    latencyMs: Math.round(1200 + rand() * 1800),
  }
}

function channelSplit(route) {
  const channels = ROUTE_TYPE_META[route.type].channels
  if (channels.length === 1) return { [channels[0]]: 1 }
  if (route.type === 'rcs+sms') return { rcs: 0.72, sms: 0.28 }
  if (route.type === 'tc+sms') return { tc: 0.68, sms: 0.32 }
  if (route.type === 'multi') return { rcs: 0.55, tc: 0.25, sms: 0.2 }
  return { sms: 1 }
}

// Per-channel delivery performance (how well each channel is doing).
function channelDeliveryRates(route, rand) {
  if (route.edgeCase === 'all-failing') {
    return { sms: 0.03, rcs: 0.01, tc: 0.02 }
  }
  if (route.edgeCase === 'inactive-template') {
    return { sms: 0.92, rcs: 0.7, tc: 0.76 }
  }
  return {
    sms: 0.93 + rand() * 0.05,
    rcs: 0.88 + rand() * 0.08,
    tc: 0.9 + rand() * 0.07,
  }
}

export function generateRouteMetrics(routeId, dateRange) {
  const route = getRouteById(routeId)
  if (!route) return null
  const profile = getProfile(route)
  const buckets = getBucketTimestamps(dateRange)
  const rand = seededRandom(`${routeId}|${dateRange}`)
  const split = channelSplit(route)
  const channelKeys = Object.keys(split)
  const chRates = channelDeliveryRates(route, seededRandom(`${routeId}|ch`))

  const series = buckets.map((ts) => {
    const dow = ts.getUTCDay()
    const seasonality = 1 - (dow === 0 || dow === 6 ? 0.25 : 0) + (rand() - 0.5) * 0.12
    const submitted = Math.max(0, Math.round(profile.baseVolume * seasonality))

    let dailyDelivery = profile.deliveryRate
    if (route.edgeCase === 'config-changed') {
      const changeTs = new Date('2026-04-08T00:00:00Z').getTime()
      dailyDelivery = ts.getTime() < changeTs ? 0.88 : 0.97
    }
    dailyDelivery = Math.min(1, Math.max(0, dailyDelivery + (rand() - 0.5) * 0.02))

    const delivered = Math.round(submitted * dailyDelivery)
    const failed = submitted - delivered

    const perChannel = {}
    channelKeys.forEach((ch) => {
      const attempted = Math.round(submitted * split[ch])
      const rate = Math.min(1, Math.max(0, (chRates[ch] || dailyDelivery) + (rand() - 0.5) * 0.04))
      perChannel[ch] = {
        attempted,
        delivered: Math.round(attempted * rate),
        deliveryRate: rate,
      }
    })

    const fallbackTriggered = Math.round(submitted * profile.fallbackRate * (0.85 + rand() * 0.3))

    return {
      ts: ts.toISOString(),
      submitted,
      delivered,
      failed,
      fallbackTriggered,
      perChannel,
      latencyMs: Math.round(profile.latencyMs * (0.85 + rand() * 0.3)),
    }
  })

  const totals = series.reduce(
    (acc, s) => {
      acc.submitted += s.submitted
      acc.delivered += s.delivered
      acc.failed += s.failed
      acc.fallbackTriggered += s.fallbackTriggered
      return acc
    },
    { submitted: 0, delivered: 0, failed: 0, fallbackTriggered: 0 },
  )

  const deliveryRate = totals.submitted ? (totals.delivered / totals.submitted) * 100 : 0
  const fallbackRate = totals.submitted ? (totals.fallbackTriggered / totals.submitted) * 100 : 0
  const avgLatency =
    series.reduce((a, s) => a + s.latencyMs * s.submitted, 0) / (totals.submitted || 1)

  const reasonTotals = FAILURE_REASONS.map((r) => {
    let weight = r.weight
    if (route.edgeCase === 'inactive-template' && r.key === 'inactive-template') weight *= 3
    if (route.edgeCase === 'all-failing' && r.key === 'operator-rejected') weight *= 2.5
    return { ...r, count: Math.round(totals.failed * weight) }
  })

  const operatorTotals = OPERATORS.map((op) => ({
    ...op,
    count: Math.round(totals.delivered * op.share * (0.9 + rand() * 0.2)),
    deliveryRate: 88 + rand() * 10,
  }))

  // Operator × channel delivery matrix (used in overall analytics).
  const operatorChannelMatrix = OPERATORS.map((op) => {
    const row = { operator: op.label, key: op.key }
    channelKeys.forEach((ch) => {
      let rate = (chRates[ch] || 0.9) * 100 + (rand() - 0.5) * 6
      if (route.edgeCase === 'all-failing') rate = rand() * 5
      row[ch] = Math.min(100, Math.max(0, rate))
    })
    return row
  })

  // Sender × template performance matrix (route-level).
  const senders = getSendersForRoute(route)
  const templates = getTemplatesForRoute(route)
  const senderTemplateMatrix = senders.map((sender) => {
    const row = { sender, cells: {} }
    templates.forEach((t) => {
      const tRand = seededRandom(`${routeId}|${sender}|${t.id}`)
      let rate = deliveryRate + (tRand() - 0.5) * 12
      if (!t.active) rate = tRand() * 8
      if (route.edgeCase === 'all-failing') rate = tRand() * 5
      rate = Math.min(100, Math.max(0, rate))
      const volume = Math.round((totals.submitted / (senders.length * templates.length)) * (0.6 + tRand() * 0.8))
      row.cells[t.id] = { rate, volume, active: t.active }
    })
    return row
  })

  // Latency histogram buckets.
  const latencyBuckets = [500, 1000, 1500, 2000, 2500, 3000, 4000, 6000, 10000]
  const latencyHistogram = latencyBuckets.map((upper, i) => {
    const lower = i === 0 ? 0 : latencyBuckets[i - 1]
    const mid = (lower + upper) / 2
    const spread = Math.abs(mid - profile.latencyMs) / profile.latencyMs
    let share = Math.exp(-spread * spread * 3)
    if (route.edgeCase === 'all-failing' && upper < 4000) share *= 0.2
    return {
      upper,
      label: upper >= 1000 ? `${upper / 1000}s` : `${upper}ms`,
      count: Math.round(totals.submitted * share * 0.12),
    }
  })

  // Previous-period deltas.
  const prevSeed = seededRandom(`${routeId}|${dateRange}|prev`)
  const deliveryDelta = (rand() - 0.5) * 4
  const fallbackDelta = (prevSeed() - 0.5) * 6
  const volumeDelta = (prevSeed() - 0.5) * 20
  const latencyDelta = (prevSeed() - 0.5) * 18

  return {
    route,
    series,
    totals,
    kpis: {
      submitted: totals.submitted,
      delivered: totals.delivered,
      deliveryRate,
      fallbackRate,
      avgLatencyMs: avgLatency,
      volumeDelta,
      deliveryDelta,
      fallbackDelta,
      latencyDelta,
    },
    split,
    reasonTotals,
    operatorTotals,
    operatorChannelMatrix,
    senders,
    templates,
    senderTemplateMatrix,
    latencyHistogram,
    profile,
  }
}

export function generateOverallMetrics(dateRange) {
  // Include most routes but exclude the brand-new (no-traffic) edge case
  // from the leaderboard since it has zero volume.
  const routes = getSmartRoutes().filter((r) => r.edgeCase !== 'new')
  const perRoute = routes.map((r) => generateRouteMetrics(r.id, dateRange))

  const totals = perRoute.reduce(
    (acc, m) => {
      acc.submitted += m.totals.submitted
      acc.delivered += m.totals.delivered
      acc.failed += m.totals.failed
      acc.fallbackTriggered += m.totals.fallbackTriggered
      return acc
    },
    { submitted: 0, delivered: 0, failed: 0, fallbackTriggered: 0 },
  )

  const buckets = perRoute[0]?.series || []
  const series = buckets.map((_, i) => {
    const ts = buckets[i].ts
    const agg = { ts, submitted: 0, delivered: 0, failed: 0, fallbackTriggered: 0, perChannel: {} }
    perRoute.forEach((m) => {
      const s = m.series[i]
      agg.submitted += s.submitted
      agg.delivered += s.delivered
      agg.failed += s.failed
      agg.fallbackTriggered += s.fallbackTriggered
      Object.entries(s.perChannel).forEach(([ch, v]) => {
        agg.perChannel[ch] = agg.perChannel[ch] || { attempted: 0, delivered: 0 }
        agg.perChannel[ch].attempted += v.attempted
        agg.perChannel[ch].delivered += v.delivered
      })
    })
    return agg
  })

  const deliveryRate = totals.submitted ? (totals.delivered / totals.submitted) * 100 : 0
  const fallbackRate = totals.submitted ? (totals.fallbackTriggered / totals.submitted) * 100 : 0
  const avgLatency =
    perRoute.reduce((a, m) => a + m.kpis.avgLatencyMs * m.totals.submitted, 0) /
    (totals.submitted || 1)

  const reasonMap = {}
  perRoute.forEach((m) => {
    m.reasonTotals.forEach((r) => {
      reasonMap[r.key] = reasonMap[r.key] || { ...r, count: 0 }
      reasonMap[r.key].count += r.count
    })
  })

  const routeTypeCounts = {}
  routes.forEach((r) => {
    routeTypeCounts[r.type] = (routeTypeCounts[r.type] || 0) + 1
  })

  // Aggregate operator × channel matrix across all routes (volume-weighted).
  const opChannels = ['sms', 'rcs', 'tc']
  const opMatrix = OPERATORS.map((op) => {
    const row = { operator: op.label, key: op.key }
    opChannels.forEach((ch) => {
      let weighted = 0
      let weight = 0
      perRoute.forEach((m) => {
        const rec = m.operatorChannelMatrix.find((x) => x.key === op.key)
        if (rec && rec[ch] != null) {
          weighted += rec[ch] * m.totals.submitted
          weight += m.totals.submitted
        }
      })
      row[ch] = weight ? weighted / weight : null
    })
    return row
  })

  // Route leaderboard rows.
  const leaderboard = perRoute.map((m) => ({
    id: m.route.id,
    name: m.route.name,
    enterprise: m.route.enterprise,
    type: m.route.type,
    channels: m.route.channels,
    volume: m.totals.submitted,
    deliveryRate: m.kpis.deliveryRate,
    fallbackRate: m.kpis.fallbackRate,
    avgLatencyMs: m.kpis.avgLatencyMs,
    status: m.route.status,
    deliveryDelta: m.kpis.deliveryDelta,
    sparkline: m.series.map((s) =>
      s.submitted ? (s.delivered / s.submitted) * 100 : 0,
    ),
  }))

  const underperforming = leaderboard
    .filter((r) => r.deliveryRate < 85 || r.deliveryDelta < -2)
    .sort((a, b) => a.deliveryRate - b.deliveryRate)
    .slice(0, 5)

  const anomalies = generateAnomalies(perRoute)

  return {
    totals,
    series,
    kpis: {
      submitted: totals.submitted,
      deliveryRate,
      fallbackRate,
      avgLatencyMs: avgLatency,
      activeRoutes: routes.filter((r) => r.status === 'active').length,
      deliveryDelta: 1.3,
      fallbackDelta: -0.8,
      volumeDelta: 12.4,
      latencyDelta: -4.2,
    },
    reasonTotals: Object.values(reasonMap),
    routeTypeCounts,
    perRoute,
    operatorChannelMatrix: opMatrix,
    leaderboard,
    underperforming,
    anomalies,
  }
}

function generateAnomalies(perRoute) {
  const out = []
  const now = new Date('2026-04-22T00:00:00Z').getTime()
  perRoute.forEach((m) => {
    if (m.kpis.deliveryRate < 20) {
      out.push({
        id: `${m.route.id}-drop`,
        severity: 'critical',
        type: 'Delivery drop',
        route: m.route.name,
        enterprise: m.route.enterprise,
        detail: `Delivery fell to ${m.kpis.deliveryRate.toFixed(1)}%`,
        ts: new Date(now - 1000 * 60 * 32).toISOString(),
      })
    }
    if (m.kpis.avgLatencyMs > 5000) {
      out.push({
        id: `${m.route.id}-lat`,
        severity: 'warning',
        type: 'Latency spike',
        route: m.route.name,
        enterprise: m.route.enterprise,
        detail: `Avg latency ${(m.kpis.avgLatencyMs / 1000).toFixed(1)}s`,
        ts: new Date(now - 1000 * 60 * 95).toISOString(),
      })
    }
    if (m.kpis.fallbackRate > 40) {
      out.push({
        id: `${m.route.id}-fb`,
        severity: 'warning',
        type: 'Fallback surge',
        route: m.route.name,
        enterprise: m.route.enterprise,
        detail: `Fallback at ${m.kpis.fallbackRate.toFixed(1)}%`,
        ts: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
      })
    }
  })
  return out.slice(0, 6)
}
