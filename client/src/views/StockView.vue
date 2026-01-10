<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { Search, Plus, Save, RotateCcw } from 'lucide-vue-next'

const items = ref([])
const categories = ref([])
const searchQuery = ref('')
const loading = ref(false)
const editingId = ref(null)
const tempStock = ref(0)
const selectedCategory = ref('')

const fetchItems = async () => {
  loading.value = true
  try {
    const response = await axios.get('http://localhost:3000/api/items')
    items.value = response.data
  } catch (error) {
    console.error('Error fetching items:', error)
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/categories')
    categories.value = response.data
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

const startEdit = (item) => {
  editingId.value = item.id
  tempStock.value = item.stock
}

const cancelEdit = () => {
  editingId.value = null
  tempStock.value = 0
}

const saveStock = async (item) => {
  try {
    await axios.put(`http://localhost:3000/api/items/${item.id}`, {
      ...item,
      stock: tempStock.value
    })
    
    // Update local state
    const index = items.value.findIndex(i => i.id === item.id)
    if (index !== -1) {
      items.value[index].stock = tempStock.value
    }
    
    editingId.value = null
  } catch (error) {
    console.error('Error updating stock:', error)
    alert('Failed to update stock')
  }
}

const filteredItems = computed(() => {
  return items.value.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value ? item.categoryId === selectedCategory.value : true
    return matchesSearch && matchesCategory
  })
})

const getStockStatus = (stock) => {
  if (stock <= 5) return { text: 'Low Stock', class: 'bg-red-100 text-red-800' }
  if (stock <= 20) return { text: 'Medium', class: 'bg-yellow-100 text-yellow-800' }
  return { text: 'In Stock', class: 'bg-green-100 text-green-800' }
}

onMounted(() => {
  fetchItems()
  fetchCategories()
})
</script>

<template>
  <DashboardLayout>
    <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Manajemen Stok</h1>
        <p class="text-gray-600 mt-1">Kelola stok barang items anda</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cari item..." 
          class="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
      </div>
      <div class="w-full sm:w-48">
        <select 
          v-model="selectedCategory"
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          <option value="">Semua Kategori</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
      </div>
    </div>

    <!-- Items Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="p-4 font-semibold text-gray-600">Nama Item</th>
              <th class="p-4 font-semibold text-gray-600">Kategori</th>
              <th class="p-4 font-semibold text-gray-600">Harga Jual</th>
              <th class="p-4 font-semibold text-gray-600 text-center">Status</th>
              <th class="p-4 font-semibold text-gray-600 text-center">Stok</th>
              <th class="p-4 font-semibold text-gray-600 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading" class="text-center py-8">
              <td colspan="6" class="p-8 text-gray-500">Loading items...</td>
            </tr>
            <tr v-else-if="filteredItems.length === 0">
              <td colspan="6" class="p-8 text-center text-gray-500">Tidak ada item ditemukan</td>
            </tr>
            <tr v-for="item in filteredItems" :key="item.id" class="hover:bg-gray-50 transition-colors">
              <td class="p-4 font-medium text-gray-800">{{ item.name }}</td>
              <td class="p-4 text-gray-600">
                <span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                  {{ item.category?.name || 'Uncategorized' }}
                </span>
              </td>
              <td class="p-4 text-gray-600">Rp {{ Number(item.sellingPrice).toLocaleString() }}</td>
              <td class="p-4 text-center">
                <span 
                  :class="['px-2 py-1 rounded-full text-xs font-medium', getStockStatus(item.stock).class]"
                >
                  {{ getStockStatus(item.stock).text }}
                </span>
              </td>
              <td class="p-4 text-center">
                <div v-if="editingId === item.id" class="flex items-center justify-center gap-2">
                  <input 
                    v-model.number="tempStock"
                    type="number"
                    min="0"
                    class="w-20 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <span v-else class="font-bold text-gray-700">{{ item.stock }}</span>
              </td>
              <td class="p-4 text-right">
                <div v-if="editingId === item.id" class="flex justify-end gap-2">
                  <button 
                    @click="saveStock(item)"
                    class="p-1 text-green-600 hover:bg-green-50 rounded"
                    title="Simpan"
                  >
                    <Save class="w-5 h-5" />
                  </button>
                  <button 
                    @click="cancelEdit"
                    class="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Batal"
                  >
                    <RotateCcw class="w-5 h-5" />
                  </button>
                </div>
                <button 
                  v-else
                  @click="startEdit(item)"
                  class="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Update Stok
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </DashboardLayout>
</template>
