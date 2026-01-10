<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { FileText, Download, Calendar, Filter } from 'lucide-vue-next'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const transactions = ref([])
const loading = ref(false)

// Config
const startDate = ref('')
const endDate = ref('')

const fetchReports = async () => {
  if (!startDate.value || !endDate.value) {
    alert("Mohon pilih tanggal awal dan akhir")
    return
  }

  loading.value = true
  try {
    const response = await api.get('/reports/sales', {
      params: {
        startDate: startDate.value,
        endDate: endDate.value
      }
    })
    transactions.value = response.data
  } catch (error) {
    console.error('Error fetching report:', error)
    alert('Gagal mengambil data laporan')
  } finally {
    loading.value = false
  }
}

// Helpers
const setToday = () => {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  startDate.value = dateStr
  endDate.value = dateStr
  fetchReports()
}

const setThisMonth = () => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  startDate.value = firstDay.toISOString().split('T')[0]
  endDate.value = lastDay.toISOString().split('T')[0]
  fetchReports()
}

const formatDate = (dateStr) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(dateStr))
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

// FORMATTING FOR EXPORT
const getExportData = () => {
  return transactions.value.map(t => ({
    'ID Transaksi': `#${t.id}`,
    'Tanggal': formatDate(t.createdAt),
    'Metode Bayar': t.paymentMethod,
    'Status': t.status,
    'Total': Number(t.totalAmount)
  }))
}

// EXPORT PDF
const exportPDF = () => {
  if (transactions.value.length === 0) return

  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(18)
  doc.text('Laporan Penjualan', 14, 22)
  doc.setFontSize(11)
  doc.text(`Periode: ${startDate.value} s/d ${endDate.value}`, 14, 28)
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 34)

  // Table
  const tableData = transactions.value.map(t => [
    t.orderId || `#${t.id}`,
    formatDate(t.createdAt),
    t.paymentMethod,
    t.status,
    formatCurrency(t.totalAmount)
  ])



  autoTable(doc, {
    startY: 40,
    head: [['ID', 'Tanggal', 'Metode', 'Status', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }, // Blue-500
    foot: [['', '', '', 'Total Pendapatan:', formatCurrency(transactions.value.reduce((sum, t) => sum + Number(t.totalAmount), 0))]]
  })

  doc.save(`Laporan_Penjualan_${startDate.value}_${endDate.value}.pdf`)
}

// EXPORT EXCEL
const exportExcel = () => {
  if (transactions.value.length === 0) return

  const data = getExportData()
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Laporan Penjualan")
  
  XLSX.writeFile(wb, `Laporan_Penjualan_${startDate.value}_${endDate.value}.xlsx`)
}

onMounted(() => {
    // Default: This Month
    setThisMonth()
})
</script>

<template>
  <DashboardLayout>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <FileText class="w-8 h-8 text-blue-600" />
        Laporan Penjualan
      </h1>
      <p class="text-gray-600">Unduh laporan penjualan dalam format PDF atau Excel</p>
    </div>

    <!-- Filters -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
       <div class="flex flex-col md:flex-row gap-4 items-end">
           <!-- Date Range -->
           <div class="flex-1 w-full grid grid-cols-2 gap-4">
               <div>
                   <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Awal</label>
                   <input v-model="startDate" type="date" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
               </div>
               <div>
                   <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
                   <input v-model="endDate" type="date" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
               </div>
           </div>

            <!-- Quick Actions -->
           <div class="flex gap-2">
               <button @click="setToday" class="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">Hari Ini</button>
               <button @click="setThisMonth" class="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">Bulan Ini</button>
           </div>

           <button 
             @click="fetchReports"
             class="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
           >
               <Filter class="w-4 h-4" />
               Tampilkan
           </button>
       </div>
    </div>

    <!-- Preview & Export -->
     <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 class="font-bold text-gray-800">Preview Data ({{ transactions.length }} Transaksi)</h2>
            
            <div class="flex gap-3">
                <button 
                    @click="exportExcel"
                    :disabled="transactions.length === 0"
                    class="flex items-center gap-2 px-4 py-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download class="w-4 h-4" />
                    Excel
                </button>
                <button 
                    @click="exportPDF"
                    :disabled="transactions.length === 0"
                    class="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download class="w-4 h-4" />
                    PDF
                </button>
            </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
             <div v-if="loading" class="p-8 text-center text-gray-500">
                <div class="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Memuat data...
            </div>
             <div v-else-if="transactions.length === 0" class="p-8 text-center text-gray-500">
                Belum ada data untuk periode ini.
            </div>
            <table v-else class="w-full text-left">
                <thead class="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th class="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">ID</th>
                        <th class="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                        <th class="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Metode</th>
                        <th class="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th class="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-right">Total</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <tr v-for="t in transactions" :key="t.id" class="hover:bg-gray-50">
                        <td class="py-3 px-4 text-sm font-medium text-gray-900">{{ t.orderId || `#${t.id}` }}</td>
                        <td class="py-3 px-4 text-sm text-gray-600">{{ formatDate(t.createdAt) }}</td>
                        <td class="py-3 px-4 text-sm text-gray-600">{{ t.paymentMethod }}</td>
                         <td class="py-3 px-4 text-sm">
                            <span class="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                {{ t.status }}
                            </span>
                        </td>
                        <td class="py-3 px-4 text-sm font-bold text-gray-900 text-right">{{ formatCurrency(t.totalAmount) }}</td>
                    </tr>
                </tbody>
                <tfoot class="bg-gray-50 border-t border-gray-200">
                     <tr>
                        <td colspan="4" class="py-3 px-4 text-sm font-bold text-gray-700 text-right">Total Pendapatan:</td>
                         <td class="py-3 px-4 text-sm font-bold text-blue-600 text-right">
                             {{ formatCurrency(transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0)) }}
                         </td>
                     </tr>
                </tfoot>
            </table>
        </div>
     </div>
  </DashboardLayout>
</template>
