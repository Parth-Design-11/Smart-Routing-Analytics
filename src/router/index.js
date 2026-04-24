import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/routes',
  },
  {
    path: '/routes',
    name: 'routes',
    component: () => import('@/views/RouteListing.vue'),
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: () => import('@/views/OverallAnalytics.vue'),
  },
  {
    path: '/routes/:id/analytics',
    name: 'route-analytics',
    component: () => import('@/views/RouteAnalytics.vue'),
    props: true,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
