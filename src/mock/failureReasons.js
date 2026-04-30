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
  { key: 'airtel', label: 'Airtel', share: 0.32 },
  { key: 'jio', label: 'Jio', share: 0.36 },
  { key: 'vi', label: 'Vi', share: 0.20 },
  { key: 'bsnl', label: 'BSNL', share: 0.06 },
  { key: 'unidentified', label: 'Unidentified', share: 0.06 },
]

// Connect-level breakdown per telco (for SMS delivery drill-down).
export const OPERATOR_CONNECTS = {
  airtel: ['Airtel_Connect_1', 'Airtel_Connect_2'],
  jio: ['Jio_Connect_1', 'Jio_Connect_2'],
  vi: ['Vi_Connect_1'],
  bsnl: ['BSNL_Connect_1'],
  unidentified: [],
}
