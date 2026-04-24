// Deterministic helpers. "Today" is fixed to keep mock data stable across reloads.
export const REFERENCE_DATE = new Date('2026-04-23T00:00:00Z')

const RANGE_META = {
  '24h': { hours: 24, buckets: 24, bucketUnit: 'hour' },
  '7d': { hours: 24 * 7, buckets: 7, bucketUnit: 'day' },
  '30d': { hours: 24 * 30, buckets: 30, bucketUnit: 'day' },
  '90d': { hours: 24 * 90, buckets: 45, bucketUnit: 'day' }, // 2-day buckets
}

export function getRangeMeta(range) {
  return RANGE_META[range] || RANGE_META['30d']
}

export function getBucketTimestamps(range) {
  const meta = getRangeMeta(range)
  const end = REFERENCE_DATE.getTime()
  const start = end - meta.hours * 3600 * 1000
  const step = (end - start) / meta.buckets
  return Array.from({ length: meta.buckets }, (_, i) => new Date(start + i * step))
}

export function getComparePeriodBuckets(range) {
  const meta = getRangeMeta(range)
  const current = getBucketTimestamps(range)
  const offset = meta.hours * 3600 * 1000
  return current.map((d) => new Date(d.getTime() - offset))
}
