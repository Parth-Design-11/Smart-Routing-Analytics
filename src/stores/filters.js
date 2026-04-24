import { defineStore } from 'pinia'

export const useFiltersStore = defineStore('filters', {
  state: () => ({
    dateRange: '30d', // 24h | 7d | 30d | 90d
    enterprise: 'all',
    channel: 'all',
    routeType: 'all',
    comparePeriod: false,
  }),
  actions: {
    setDateRange(v) {
      this.dateRange = v
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
