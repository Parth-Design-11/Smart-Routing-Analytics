// Deterministic helpers. "Today" is fixed to keep mock data stable across reloads.
export const REFERENCE_DATE = new Date('2026-04-23T00:00:00Z')

const RANGE_META = {
  // Legacy presets kept for RouteAnalytics compatibility
  '24h': { hours: 24, buckets: 24, bucketUnit: 'hour' },
  '90d': { hours: 24 * 90, buckets: 45, bucketUnit: 'day' },
  // New PRD presets
  'today':      { hours: 24,      buckets: 24, bucketUnit: 'hour' },
  'yesterday':  { hours: 24,      buckets: 24, bucketUnit: 'hour', offsetDays: 1 },
  '7d':         { hours: 24 * 7,  buckets: 7,  bucketUnit: 'day' },
  '15d':        { hours: 24 * 15, buckets: 15, bucketUnit: 'day' },
  '30d':        { hours: 24 * 30, buckets: 30, bucketUnit: 'day' },
  'this-month': { hours: 24 * 22, buckets: 22, bucketUnit: 'day' }, // Apr 1–22 (22 days before Apr 23)
}

export function getRangeMeta(range) {
  return RANGE_META[range] || RANGE_META['30d']
}

export function getBucketTimestamps(range, customStart, customEnd) {
  if (range === 'custom' && customStart && customEnd) {
    const start = new Date(customStart).getTime()
    const end = new Date(customEnd).getTime() + 24 * 3600 * 1000 // include end day
    const days = Math.max(1, Math.round((end - start) / (24 * 3600 * 1000)))
    const buckets = Math.min(31, days)
    const step = (end - start) / buckets
    return Array.from({ length: buckets }, (_, i) => new Date(start + i * step))
  }

  const meta = getRangeMeta(range)
  const offsetMs = (meta.offsetDays || 0) * 24 * 3600 * 1000
  const end = REFERENCE_DATE.getTime() - offsetMs
  const start = end - meta.hours * 3600 * 1000
  const step = (end - start) / meta.buckets
  return Array.from({ length: meta.buckets }, (_, i) => new Date(start + i * step))
}

export function getComparePeriodBuckets(range, customStart, customEnd) {
  const meta = getRangeMeta(range)
  const current = getBucketTimestamps(range, customStart, customEnd)
  const offset = meta.hours * 3600 * 1000
  return current.map((d) => new Date(d.getTime() - offset))
}

// Human-readable label for the active date range
export function getDateRangeLabel(range, customStart, customEnd) {
  const labels = {
    'today': 'Today',
    'yesterday': 'Yesterday',
    '7d': 'Last 7 days',
    '15d': 'Last 15 days',
    '30d': 'Last 30 days',
    'this-month': 'This month',
    '24h': 'Last 24 hours',
    '90d': 'Last 90 days',
  }
  if (range === 'custom' && customStart && customEnd) {
    return `${customStart} – ${customEnd}`
  }
  return labels[range] || range
}
