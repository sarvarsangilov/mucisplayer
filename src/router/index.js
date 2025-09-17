import { createRouter, createWebHistory } from '@ionic/vue-router';
import TabsPage from '../views/TabsPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/tabs/tab1'
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/tab1'
      },
      {
        path: 'tab1',
        name: 'Tab1Page',
        component: () => import('@/views/Tab1Page.vue')
      },
      {
        path: 'tab2',
        name: 'Tab2Page',
        component: () => import('@/views/Tab2Page.vue')
      },
      {
        path: 'tab3',
        name: 'Tab3Page',
        component: () => import('@/views/Tab3Page.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
