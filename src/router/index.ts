import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Dashboard' }
  },
  {
    path: '/documents',
    name: 'documents',
    component: () => import('@/views/DocumentsView.vue'),
    meta: { title: 'Documents' }
  },
  {
    path: '/templates',
    name: 'templates',
    component: () => import('@/views/TemplatesView.vue'),
    meta: { title: 'Templates' }
  },
  {
    path: '/signatures',
    name: 'signatures',
    component: () => import('@/views/SignaturesView.vue'),
    meta: { title: 'My Signatures' }
  },
  {
    path: '/editor/:id',
    name: 'editor',
    component: () => import('@/views/EditorView.vue'),
    meta: { title: 'Prepare Document', fullscreen: true }
  },
  {
    path: '/sign/:id',
    name: 'sign',
    component: () => import('@/views/SigningView.vue'),
    meta: { title: 'Sign Document', fullscreen: true }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: 'Settings' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'home' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.afterEach((to) => {
  const title = (to.meta?.title as string | undefined) ?? 'Wing Sign'
  document.title = `${title} · Wing Sign`
})

export default router
