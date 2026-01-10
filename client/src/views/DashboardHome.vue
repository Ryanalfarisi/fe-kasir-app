<script setup>
import { ref, onMounted } from 'vue'
import api from '../api' // Correctly import the configured api instance
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import { TrendingUp, ShoppingBag, AlertCircle, DollarSign } from 'lucide-vue-next'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const stats = ref({
  totalRevenue: 0,
  todayRevenue: 0,
  todayTransactionsCount: 0,
  lowStockCount: 0,
  salesChart: []
})

const loading = ref(true)

const chartData = ref({
  labels: [],
  datasets: []
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: '#f3f4f6'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
}

const fetchAnalytics = async () => {
  loading.value = true
  try {
    const response = await api.get('/analytics')
    stats.value = response.data
    
    // Setup Chart Data
    chartData.value = {
      labels: response.data.salesChart.map(s => formatDate(s.date)),
      datasets: [{
        label: 'Pendapatan',
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        data: response.data.salesChart.map(s => s.amount)
      }]
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', { d: 'numeric', weekday: 'short' }).format(date)
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

onMounted(() => {
  fetchAnalytics()
})
</script>

<template>
  <DashboardLayout>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
      <p class="text-gray-600">Ringkasan aktivitas toko anda</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Total Revenue -->
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <div class="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <DollarSign class="w-6 h-6" />
          </div>
          <span class="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">All Time</span>
        </div>
        <h3 class="text-gray-500 text-sm font-medium">Total Pendapatan</h3>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ formatCurrency(stats.totalRevenue) }}</p>
      </div>

      <!-- Today's Revenue -->
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <div class="p-3 bg-green-50 text-green-600 rounded-lg">
            <TrendingUp class="w-6 h-6" />
          </div>
          <span class="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Hari Ini</span>
        </div>
        <h3 class="text-gray-500 text-sm font-medium">Pendapatan Hari Ini</h3>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ formatCurrency(stats.todayRevenue) }}</p>
      </div>

      <!-- Transactions Count -->
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <div class="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <ShoppingBag class="w-6 h-6" />
          </div>
          <span class="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">Hari Ini</span>
        </div>
        <h3 class="text-gray-500 text-sm font-medium">Total Transaksi</h3>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ stats.todayTransactionsCount }}</p>
      </div>

      <!-- Low Stock -->
      <router-link to="/stock" class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
        <div class="flex items-center justify-between mb-4">
          <div class="p-3 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100 transition-colors">
            <AlertCircle class="w-6 h-6" />
          </div>
          <span class="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">Perhatian</span>
        </div>
        <h3 class="text-gray-500 text-sm font-medium">Stok Menipis</h3>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ stats.lowStockCount }} Item</p>
      </router-link>
    </div>

    <!-- Charts & Quick Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Chart Area -->
      <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="font-bold text-gray-800 mb-6">Grafik Penjualan (7 Hari Terakhir)</h3>
        <div class="h-80 w-full relative">
          <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <span class="text-gray-400">Loading chart...</span>
          </div>
          <Bar v-if="!loading" :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="space-y-6">
        <div class="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
          <h3 class="font-bold text-xl mb-2">Kasir / POS</h3>
          <p class="text-blue-100 mb-6 text-sm">Masuk ke halaman kasir untuk memproses transaksi baru.</p>
          <router-link 
            to="/transaction" 
            class="block w-full text-center bg-white text-blue-600 font-bold py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Buat Transaksi Baru
          </router-link>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 class="font-bold text-gray-800 mb-4">Pintasan Menu</h3>
          <nav class="space-y-2">
            <router-link to="/stock" class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group">
              <span class="text-gray-600 group-hover:text-blue-600">Manajemen Stok</span>
              <span class="text-gray-400 text-sm">&rarr;</span>
            </router-link>

            <router-link to="/items" class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group">
              <span class="text-gray-600 group-hover:text-blue-600">Master Data Item</span>
              <span class="text-gray-400 text-sm">&rarr;</span>
            </router-link>
          </nav>
        </div>
      </div>

    </div>
  </DashboardLayout>
</template>
