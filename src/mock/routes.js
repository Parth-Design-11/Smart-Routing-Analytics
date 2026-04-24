// Route fixtures — keep in sync with edgeCaseRoutes.js.
// Route "types":
//   sms            → SMS only (operator-level routing)
//   rcs+sms        → RCS primary, SMS fallback
//   tc+sms         → TrueCaller primary, SMS fallback
//   multi          → Multi-channel with priority order, SMS always default fallback

export const ENTERPRISES = ['HDFC Cards', 'Dream 11', 'ICICI', 'Flipkart']

export const CHANNEL_TYPES = [
  { value: 'sms', label: 'SMS' },
  { value: 'rcs', label: 'RCS' },
  { value: 'tc', label: 'TrueCaller' },
]

export const ROUTE_TYPE_META = {
  sms: { label: 'SMS', channels: ['sms'] },
  'rcs+sms': { label: 'RCS → SMS', channels: ['rcs', 'sms'] },
  'tc+sms': { label: 'TC → SMS', channels: ['tc', 'sms'] },
  multi: { label: 'Multi-channel', channels: ['rcs', 'tc', 'sms'] },
}

import { EDGE_CASE_ROUTES } from './edgeCaseRoutes'

const BASE_ROUTES = [
  {
    id: 'default',
    name: 'Default',
    isDefault: true,
    enterprise: 'HDFC Cards',
    smppAccount: '—',
    type: 'sms',
    channels: ['sms'],
    status: 'active',
    createdOn: '2021-02-19',
    lastModified: '2021-02-19',
  },
  {
    id: 'route-1',
    name: 'Route 1',
    enterprise: 'Dream 11',
    smppAccount: 'SMPP 1',
    type: 'sms',
    channels: ['sms'],
    status: 'active',
    createdOn: '2021-02-19',
    lastModified: '2021-02-19',
  },
  {
    id: 'route-2',
    name: 'Route 2',
    enterprise: 'Dream 11',
    smppAccount: 'SMPP 2',
    type: 'tc+sms',
    channels: ['tc', 'sms'],
    status: 'active',
    createdOn: '2021-02-19',
    lastModified: '2021-03-22',
  },
  {
    id: 'route-3',
    name: 'Route 3',
    enterprise: 'Dream 11',
    smppAccount: 'SMPP 3',
    type: 'multi',
    channels: ['rcs', 'tc', 'sms'],
    priority: ['rcs', 'tc', 'sms'],
    status: 'active',
    createdOn: '2021-02-19',
    lastModified: '2021-04-15',
  },
  {
    id: 'route-4',
    name: 'Route 4',
    enterprise: 'Dream 11',
    smppAccount: 'SMPP 4',
    type: 'multi',
    channels: ['rcs', 'tc', 'sms'],
    priority: ['rcs', 'tc', 'sms'],
    status: 'active',
    createdOn: '2021-02-19',
    lastModified: '2021-05-30',
  },
  {
    id: 'route-5',
    name: 'Route 5',
    enterprise: 'Dream 11',
    smppAccount: 'SMPP 5',
    type: 'rcs+sms',
    channels: ['rcs', 'sms'],
    status: 'active',
    createdOn: '2021-02-19',
    lastModified: '2021-06-10',
  },
  {
    id: 'route-6',
    name: 'HDFC Card Renewal',
    enterprise: 'HDFC Cards',
    smppAccount: 'SMPP A',
    type: 'rcs+sms',
    channels: ['rcs', 'sms'],
    status: 'active',
    createdOn: '2025-09-12',
    lastModified: '2026-03-04',
  },
  {
    id: 'route-7',
    name: 'ICICI OTP Priority',
    enterprise: 'ICICI',
    smppAccount: 'SMPP B',
    type: 'multi',
    channels: ['rcs', 'tc', 'sms'],
    priority: ['rcs', 'tc', 'sms'],
    status: 'active',
    createdOn: '2025-11-02',
    lastModified: '2026-04-10',
  },
  {
    id: 'route-8',
    name: 'Flipkart Order Updates',
    enterprise: 'Flipkart',
    smppAccount: 'SMPP C',
    type: 'tc+sms',
    channels: ['tc', 'sms'],
    status: 'active',
    createdOn: '2026-01-18',
    lastModified: '2026-04-01',
  },
]

export const ROUTES = [...BASE_ROUTES, ...EDGE_CASE_ROUTES]

export function getRouteById(id) {
  return ROUTES.find((r) => r.id === id)
}

export function getSmartRoutes() {
  return ROUTES.filter((r) => !r.isDefault)
}

export function getDefaultRoute() {
  return ROUTES.find((r) => r.isDefault)
}
