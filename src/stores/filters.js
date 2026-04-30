import { defineStore } from 'pinia'

export const useFiltersStore = defineStore('filters', {
  state: () => ({
    dateRange: '30d', // today | yesterday | 7d | 30d | this-month | custom | 24h | 90d
    customStart: null, // ISO date string e.g. '2026-04-01' (used when dateRange === 'custom')
    customEnd: null,   // ISO date string e.g. '2026-04-23'
    enterprise: 'all',
    channel: 'all',
    routeType: 'all',
    comparePeriod: false,
  }),
  actions: {
    setDateRange(v) {
      this.dateRange = v
    },
    setCustomRange(start, end) {
      this.customStart = start
      this.customEnd = end
      this.dateRange = 'custom'
    },
    setEnterprise(v) {
      this.enterprise = v
    },
    setChannel(v) {
      this.channel = v
    },
    setRouteType(v) {
      this.routeType = v
    },
    setComparePeriod(v) {
      this.comparePeriod = v
    },
  },
})
