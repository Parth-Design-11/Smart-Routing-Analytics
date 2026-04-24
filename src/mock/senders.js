// Sender IDs and templates per enterprise. Deterministic — used by the
// sender × template matrix and the sender-template breakdown table.

export const SENDERS_BY_ENTERPRISE = {
  'HDFC Cards': ['HDFCBK', 'HDFCCC', 'HDFCRN'],
  'Dream 11': ['DRM11', 'DRM11P'],
  ICICI: ['ICICIB', 'ICICIOT'],
  Flipkart: ['FLPKRT', 'FLPORD', 'FLPOTP'],
}

export const TEMPLATE_TYPES = [
  { id: 'otp', name: 'OTP' },
  { id: 'txn', name: 'Txn Alert' },
  { id: 'rem', name: 'Reminder' },
  { id: 'promo', name: 'Promotional' },
  { id: 'stmt', name: 'Statement' },
]

export function getSendersForRoute(route) {
  return SENDERS_BY_ENTERPRISE[route.enterprise] || ['GENERIC']
}

export function getTemplatesForRoute(route) {
  // Keep 4 templates. Edge case "inactive-template" flips the last two off.
  const pool = TEMPLATE_TYPES.slice(0, 4)
  return pool.map((t, i) => ({
    ...t,
    active: !(route.edgeCase === 'inactive-template' && i >= 2),
  }))
}
