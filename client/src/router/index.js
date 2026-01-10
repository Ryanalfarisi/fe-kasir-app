import { createRouter, createWebHistory } from 'vue-router'
import ItemList from '../views/ItemList.vue'
import StockView from '../views/StockView.vue'
import TransactionView from '../views/TransactionView.vue'
import DashboardHome from '../views/DashboardHome.vue'
import LoginView from '../views/LoginView.vue'
import EmployeeView from '../views/EmployeeView.vue'
import CategoryList from '../views/CategoryList.vue'
import TransactionList from '../views/TransactionList.vue'
import ReportView from '../views/ReportView.vue'
import SettingsView from '../views/SettingsView.vue'
import DiscountView from '../views/DiscountView.vue'
import DemoRequestView from '../views/DemoRequestView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true }
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardHome,
      meta: { requiresAuth: true }
    },
    {
      path: '/items',
      name: 'items',
      component: ItemList,
      meta: { requiresAuth: true, roles: ['ADMIN'] }
    },
    {
      path: '/stock',
      name: 'stock',
      component: StockView,
      meta: { requiresAuth: true }
    },
    {
      path: '/transaction',
      name: 'transaction',
      component: TransactionView,
      meta: { requiresAuth: true }
    },
    {
      path: '/employees',
      name: 'employees',
      component: EmployeeView,
      meta: { requiresAuth: true, roles: ['ADMIN'] }
    },
    {
      path: '/categories',
      name: 'categories',
      component: CategoryList,
      meta: { requiresAuth: true, roles: ['ADMIN'] }
    },
    {
      path: '/history',
      name: 'history',
      component: TransactionList,
      meta: { requiresAuth: true }
    },
    {
      path: '/reports',
      name: 'reports',
      component: ReportView,
      meta: { requiresAuth: true, roles: ['ADMIN'] }
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: { requiresAuth: true, roles: ['ADMIN'] }
    },
    {
      path: '/discounts',
      name: 'discounts',
      component: DiscountView,
      meta: { requiresAuth: true, roles: ['ADMIN'] }
    },
    {
      path: '/demo-requests',
      name: 'demo-requests',
      component: DemoRequestView,
      meta: { requiresAuth: true, roles: ['ADMIN'] }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  
  // 1. Check for requiresAuth
  if (to.meta.requiresAuth && !token) {
    return next({ name: 'login' })
  }

  // 2. Check for requiresGuest (Login page)
  if (to.meta.requiresGuest && token) {
    return next({ name: 'dashboard' })
  }

  // 3. Check Role Permission
  if (to.meta.roles && user) {
    if (!to.meta.roles.includes(user.role)) {
      alert('Akses Ditolak: Anda tidak memiliki izin.')
      return next(false) // Cancel navigation
    }
  }

  next()
})

export default router
