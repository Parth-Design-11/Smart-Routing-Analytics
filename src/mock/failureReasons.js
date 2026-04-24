export const FAILURE_REASONS = [
  { key: 'handset-unreachable', label: 'Handset unreachable', weight: 0.28 },
  { key: 'dnd', label: 'DND', weight: 0.18 },
  { key: 'operator-rejected', label: 'Operator rejection', weight: 0.16 },
  { key: 'agent-not-found', label: 'RCS agent not found', weight: 0.12 },
  { key: 'inactive-template', label: 'Inactive template', weight: 0.09 },
  { key: 'invalid-number', label: 'Invalid number', weight: 0.08 },
  { key: 'timeout', label: 'Delivery timeout', weight: 0.06 },
  { key: 'other', label: 'Other', weight: 0.03 },
]

export const OPERATORS = [
  { key: 'airtel', label: 'Airtel', share: 0.34 },
  { key: 'jio', label: 'Jio', share: 0.38 },
  { key: 'vi', label: 'Vi', share: 0.21 },
  { key: 'bsnl', label: 'BSNL', share: 0.07 },
]
