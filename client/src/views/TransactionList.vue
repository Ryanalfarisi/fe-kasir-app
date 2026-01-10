<script setup>
import { ref, onMounted, nextTick, watch } from 'vue' // Added watch
import api from '../api'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import ReceiptPrint from '../components/ReceiptPrint.vue'
import Pagination from '../components/Pagination.vue' // Added
import { FileText, Search, Printer, Eye, X, Calendar, RefreshCcw } from 'lucide-vue-next'

const transactions = ref([])
const loading = ref(true)
const storeSettings = ref(null)

// Filters & Pagination State
const search = ref('')

// Default Dates: Today and 7 days ago
const end = new Date()
const start = new Date()
start.setDate(end.getDate() - 7)

const startDate = ref(start.toISOString().split('T')[0])
const endDate = ref(end.toISOString().split('T')[0])
const currentPage = ref(1)
const paginationData = ref({
    page: 1, 
    limit: 10,
    total: 0,
    totalPages: 1
})

const fetchSettings = async () => {
    try {
        const res = await api.get('/settings')
        storeSettings.value = res.data
        if (storeSettings.value.storeLogo) {
             const img = new Image()
             img.src = `${import.meta.env.VITE_API_URL}${storeSettings.value.storeLogo}`
        }
    } catch (error) {
        console.error('Error fetching settings:', error)
    }
}

// Detail Modal State
const showDetailModal = ref(false)
const selectedTrx = ref(null)
const receiptData = ref(null)

const fetchTransactions = async (page = 1) => {
  loading.value = true
  try {
    const params = {
        page: page,
        limit: 10,
        search: search.value,
        startDate: startDate.value,
        endDate: endDate.value
    }
    
    // Remove empty params
    Object.keys(params).forEach(key => !params[key] && delete params[key])

    const response = await api.get('/transactions', { params })
    
    // Handle new API structure
    if (response.data.data) {
        transactions.value = response.data.data
        paginationData.value = response.data.pagination
        currentPage.value = response.data.pagination.page
    } else {
        // Fallback for old API if needed (though backend is updated)
        transactions.value = response.data
    }

  } catch (error) {
    console.error('Error fetching transactions:', error)
  } finally {
    loading.value = false
  }
}

const handlePageChange = (newPage) => {
    fetchTransactions(newPage)
}

const handleSearch = () => {
    currentPage.value = 1
    fetchTransactions(1)
}

const resetFilters = () => {
    search.value = ''
    
    // Reset to default 7 days
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 7)
    
    startDate.value = start.toISOString().split('T')[0]
    endDate.value = end.toISOString().split('T')[0]
    
    currentPage.value = 1
    fetchTransactions(1)
}

onMounted(() => {
  fetchTransactions()
  fetchSettings()
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(new Date(dateStr))
  } catch (e) {
      return dateStr
  }
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

const getStatusColor = (status) => {
    switch(status) {
        case 'SUCCESS': return 'bg-green-100 text-green-700'
        case 'PENDING': return 'bg-yellow-100 text-yellow-700'
        case 'FAILED': return 'bg-red-100 text-red-700'
        default: return 'bg-gray-100 text-gray-700'
    }
}

const handlePrint = async (trx) => {
    const dateObj = new Date(trx.createdAt)
    receiptData.value = {
        orderId: trx.orderId || `#${trx.id}`,
        date: dateObj.toLocaleDateString('id-ID'),
        time: dateObj.toLocaleTimeString('id-ID'),
        cashier: 'Admin',
        items: trx.items.map(i => ({
            name: i.item.name,
            qty: i.quantity,
            price: Number(i.price)
        })),
        total: Number(trx.totalAmount),
        paymentMethod: trx.paymentMethod,
        cash: Number(trx.totalAmount),
        change: 0,
        note: trx.note
    }
    
    await nextTick()
    window.print()
}

const viewDetail = (trx) => {
    selectedTrx.value = trx
    showDetailModal.value = true
}

const closeDetail = () => {
    showDetailModal.value = false
    selectedTrx.value = null
}
</script>

<template>
  <DashboardLayout>
    <div class="mb-8 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Riwayat Transaksi</h1>
        <p class="text-gray-600">Daftar semua transaksi penjualan</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      
      <!-- Filters -->
      <div class="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-end md:items-center">
           <!-- Search -->
           <div class="relative flex-1 w-full">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                    v-model="search"
                    @keyup.enter="handleSearch"
                    type="text" 
                    placeholder="Cari ID Transaksi..." 
                    class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                />
           </div>

           <!-- Date Range -->
           <div class="flex gap-2 w-full md:w-auto">
               <div class="relative flex-1 md:w-40">
                   <input v-model="startDate" type="date" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none" />
               </div>
               <span class="self-center text-gray-400">-</span>
               <div class="relative flex-1 md:w-40">
                   <input v-model="endDate" type="date" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none" />
               </div>
           </div>

           <!-- Buttons -->
           <div class="flex gap-2 w-full md:w-auto">
                <button @click="handleSearch" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                    <Search class="w-4 h-4" /> Cari
                </button>
                <button @click="resetFilters" class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors border border-gray-200" title="Reset Filter">
                    <RefreshCcw class="w-4 h-4" />
                </button>
           </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-8 text-center text-gray-500">
        <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        Memuat data...
      </div>

      <!-- Empty State -->
      <div v-else-if="transactions.length === 0" class="p-8 text-center text-gray-500">
        <FileText class="w-12 h-12 mx-auto mb-2 opacity-20" />
        Belum ada transaksi.
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="py-3 px-4 font-semibold text-gray-600 text-sm">#ID</th>
              <th class="py-3 px-4 font-semibold text-gray-600 text-sm">Tanggal</th>
              <th class="py-3 px-4 font-semibold text-gray-600 text-sm">Metode</th>
              <th class="py-3 px-4 font-semibold text-gray-600 text-sm">Status</th>
              <th class="py-3 px-4 font-semibold text-gray-600 text-sm text-right">Total</th>
              <th class="py-3 px-4 font-semibold text-gray-600 text-sm text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="trx in transactions" :key="trx.id" class="hover:bg-gray-50 transition-colors">
              <td class="py-3 px-4 text-sm font-medium text-gray-800">#{{ trx.orderId }}</td>
              <td class="py-3 px-4 text-sm text-gray-600">{{ formatDate(trx.createdAt) }}</td>
              <td class="py-3 px-4 text-sm">
                  <span class="px-2 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                      {{ trx.paymentMethod }}
                  </span>
              </td>
              <td class="py-3 px-4 text-sm">
                  <span :class="['px-2 py-1 rounded-full text-xs font-bold', getStatusColor(trx.status)]">
                      {{ trx.status }}
                  </span>
              </td>
              <td class="py-3 px-4 text-sm font-bold text-gray-800 text-right">{{ formatCurrency(trx.totalAmount) }}</td>
              <td class="py-3 px-4 text-sm text-center">
                  <div class="flex items-center justify-center gap-2">
                        <button 
                            @click="viewDetail(trx)"
                            class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Lihat Detail"
                        >
                            <Eye class="w-4 h-4" />
                        </button>
                        <button 
                            @click="handlePrint(trx)"
                            class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Cetak Struk"
                        >
                            <Printer class="w-4 h-4" />
                        </button>
                  </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Pagination Component -->
        <Pagination :pagination="paginationData" @page-change="handlePageChange" />
      </div>
    </div>

    <!-- DETAIL MODAL -->
    <div v-if="showDetailModal && selectedTrx" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <!-- Header -->
            <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                     <h3 class="font-bold text-lg text-gray-800">Detail Transaksi</h3>
                     <p class="text-sm text-gray-500">#{{ selectedTrx.orderId }}</p>
                </div>
                <button @click="closeDetail" class="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm border border-gray-200">
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Scrollable Content -->
            <div class="p-6 overflow-y-auto">
                <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div>
                        <p class="text-gray-500 mb-1">Tanggal</p>
                        <p class="font-medium text-gray-800">{{ formatDate(selectedTrx.createdAt) }}</p>
                    </div>
                    <div>
                        <p class="text-gray-500 mb-1">Status</p>
                        <span :class="['px-2 py-0.5 rounded text-xs font-bold', getStatusColor(selectedTrx.status)]">
                            {{ selectedTrx.status }}
                        </span>
                    </div>
                    <div>
                        <p class="text-gray-500 mb-1">Pembayaran</p>
                        <p class="font-medium text-gray-800">{{ selectedTrx.paymentMethod }}</p>
                    </div>
                     <div>
                        <p class="text-gray-500 mb-1">Kasir</p>
                        <p class="font-medium text-gray-800">Admin</p>
                    </div>
                </div>
                
                <div v-if="selectedTrx.note" class="mb-6 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                    <p class="text-xs font-bold text-yellow-800 uppercase mb-1">Catatan:</p>
                    <p class="text-sm text-yellow-900">{{ selectedTrx.note }}</p>
                </div>

                <div class="border rounded-xl overflow-hidden mb-6">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th class="py-2 px-4 font-semibold text-gray-600">Produk</th>
                                <th class="py-2 px-4 font-semibold text-gray-600 text-center">Qty</th>
                                <th class="py-2 px-4 font-semibold text-gray-600 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-50">
                             <tr v-for="item in selectedTrx.items" :key="item.id">
                                <td class="py-3 px-4">
                                    <p class="font-medium text-gray-800">{{ item.item.name }}</p>
                                    <p class="text-xs text-gray-500">@ {{ formatCurrency(item.price) }}</p>
                                </td>
                                <td class="py-3 px-4 text-center text-gray-600">x{{ item.quantity }}</td>
                                <td class="py-3 px-4 text-right font-medium text-gray-800">{{ formatCurrency(item.price * item.quantity) }}</td>
                             </tr>
                        </tbody>
                        <tfoot class="bg-gray-50 border-t border-gray-100">
                             <tr>
                                <td colspan="2" class="py-3 px-4 font-bold text-gray-700 text-right">Total Akhir</td>
                                <td class="py-3 px-4 font-bold text-blue-600 text-right text-base">{{ formatCurrency(selectedTrx.totalAmount) }}</td>
                             </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Footer -->
             <div class="p-4 border-t border-gray-100 flex gap-3">
                 <button @click="handlePrint(selectedTrx)" class="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                     <Printer class="w-4 h-4" /> Cetak Struk
                 </button>
                 <button @click="closeDetail" class="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors">
                     Tutup
                 </button>
             </div>
        </div>
    </div>
  </DashboardLayout>

  <ReceiptPrint v-if="receiptData" :data="receiptData" :settings="storeSettings" />
</template>
