<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, FileText, Settings, Inbox } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const user = JSON.parse(localStorage.getItem('user') || '{}')
const role = user.role || 'KASIR'

const allLinks = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'KASIR'] },
  { name: 'Stock', path: '/stock', icon: Package, roles: ['ADMIN', 'KASIR'] }, // Visible to all? Plan says Role access module. Let's assume Stock is visible but maybe read-only for cashiers? Or just visible.
  { name: 'Transaksi', path: '/transaction', icon: ShoppingCart, roles: ['ADMIN', 'KASIR'] },
  { name: 'Riwayat', path: '/history', icon: FileText, roles: ['ADMIN', 'KASIR'] },
  { name: 'Karyawan', path: '/employees', icon: Users, roles: ['ADMIN'] },
  { name: 'Laporan', path: '/reports', icon: FileText, roles: ['ADMIN'] },
  { name: 'Master Item', path: '/items', icon: Package, roles: ['ADMIN'] },
  { name: 'Master Kategori', path: '/categories', icon: LayoutDashboard, roles: ['ADMIN'] },
  { name: 'Diskon', path: '/discounts', icon: FileText, roles: ['ADMIN'] }, // Added Discount
  { name: 'Request Demo', path: '/demo-requests', icon: Inbox, roles: ['ADMIN'] },
  { name: 'Pengaturan', path: '/settings', icon: Settings, roles: ['ADMIN'] }, // Added Settings
]

const links = computed(() => {
  return allLinks.filter(link => link.roles.includes(role))
})

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<template>
  <aside class="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col h-screen fixed">
    <div class="p-6 border-b border-gray-200">
      <h1 class="text-2xl font-bold text-gray-800">Kasir App</h1>
      <p class="text-xs text-gray-500 mt-1">Halo, {{ user.name || 'User' }}</p>
    </div>
    
    <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
      <RouterLink
        v-for="link in links"
        :key="link.path"
        :to="link.path"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200"
        :class="[
          route.path === link.path
            ? 'bg-blue-50 text-blue-600 font-medium'
            : 'text-gray-600 hover:bg-gray-50'
        ]"
      >
        <component :is="link.icon" class="w-5 h-5" />
        {{ link.name }}
      </RouterLink>
    </nav>

    <div class="p-4 border-t border-gray-200 bg-gray-50/50">
        <!-- Profile Info -->
        <div class="flex items-center gap-3 mb-4 px-2">
            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                {{ user.name ? user.name.charAt(0).toUpperCase() : 'U' }}
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-gray-800 truncate">{{ user.name || 'User' }}</p>
                <p class="text-xs text-blue-600 font-medium truncate uppercase tracking-wider">{{ user.role || 'Kasir' }}</p>
            </div>
        </div>

      <button 
        @click="handleLogout"
        class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors text-sm font-semibold"
      >
        <LogOut class="w-4 h-4" />
        Keluar
      </button>
    </div>
  </aside>

  <!-- Mobile Header (Visible only on small screens) -->
  <div class="md:hidden bg-white border-b border-gray-200 p-4 fixed w-full top-0 z-50 flex justify-between items-center">
    <h1 class="text-xl font-bold text-gray-800">Kasir App</h1>
    <button @click="handleLogout" class="text-red-600">
      <LogOut class="w-5 h-5" />
    </button>
  </div>

  <!-- Bottom Navigation for Mobile -->
  <nav class="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-50 flex justify-around p-2">
    <RouterLink
      v-for="link in links"
      :key="link.path"
      :to="link.path"
      class="flex flex-col items-center p-2 rounded-lg"
      :class="[
        route.path === link.path
          ? 'text-blue-600'
          : 'text-gray-500'
      ]"
    >
      <component :is="link.icon" class="w-6 h-6" />
      <span class="text-xs mt-1">{{ link.name }}</span>
    </RouterLink>
  </nav>
</template>
