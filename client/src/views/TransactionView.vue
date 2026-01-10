<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import api from '../api' // Use configured API
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, X, QrCode, ShoppingBag, Printer } from 'lucide-vue-next'
import QrcodeVue from 'qrcode.vue'
import ReceiptPrint from '../components/ReceiptPrint.vue'
import { useToast } from '../composables/useToast' // Import

const { success, error, warning } = useToast() // Destructure

const items = ref([])
const categories = ref([])
const cart = ref([])
const searchQuery = ref('')
const selectedCategory = ref('')
const loading = ref(false)
const processingPayment = ref(false)

// Payment Config
const paymentMethod = ref('CASH') // CASH, QRIS
const showQrisModal = ref(false)
const currentTransaction = ref(null)
const note = ref('') // Added transaction note

// Discount Logic
const discounts = ref([])
const selectedDiscountId = ref('')
const selectedDiscount = computed(() => discounts.value.find(d => d.id === selectedDiscountId.value))

const discountAmount = computed(() => {
    if (!selectedDiscount.value) return 0
    let amount = 0
    if (selectedDiscount.value.type === 'PERCENTAGE') {
        amount = cartTotal.value * (Number(selectedDiscount.value.value) / 100)
    } else {
        amount = Number(selectedDiscount.value.value)
    }
    // Cap at total
    return Math.min(amount, cartTotal.value)
})

const finalTotal = computed(() => Math.max(0, cartTotal.value - discountAmount.value))

// Cash Payment Logic
const cashReceived = ref(0)
const change = computed(() => {
    return Math.max(0, cashReceived.value - finalTotal.value)
})

const addCash = (amount) => {
    cashReceived.value += amount
}

const fetchItems = async () => {
  loading.value = true
  try {
    const response = await api.get('/items')
    items.value = response.data
  } catch (error) {
    console.error('Error fetching items:', error)
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const response = await api.get('/categories')
    categories.value = response.data
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

const fetchDiscounts = async () => {
    try {
        const res = await api.get('/discounts')
        // Only show active discounts
        discounts.value = res.data.filter(d => d.isActive)
    } catch (error) {
        console.error('Error fetching discounts:', error)
    }
}

// ... (addToCart, removeFromCart, updateQuantity, cartTotal, filteredItems remain same) ...





const addToCart = (item) => {
  if (item.stock <= 0) return
  const existingItem = cart.value.find(i => i.id === item.id)
  
  if (existingItem) {
    if (existingItem.quantity >= item.stock) return
    existingItem.quantity++
  } else {
    cart.value.push({ ...item, quantity: 1 })
  }
}

const removeFromCart = (itemId) => {
  cart.value = cart.value.filter(item => item.id !== itemId)
}

const updateQuantity = (itemId, change) => {
  const cartItem = cart.value.find(item => item.id === itemId)
  const originalItem = items.value.find(item => item.id === itemId)
  if (!cartItem || !originalItem) return

  const newQuantity = cartItem.quantity + change
  if (newQuantity > 0 && newQuantity <= originalItem.stock) {
    cartItem.quantity = newQuantity
  } else if (newQuantity <= 0) {
    removeFromCart(itemId)
  }
}

const cartTotal = computed(() => {
  return cart.value.reduce((total, item) => total + (item.sellingPrice * item.quantity), 0)
})

const filteredItems = computed(() => {
  return items.value.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value ? item.categoryId === selectedCategory.value : true
    return matchesSearch && matchesCategory
  })
})

// QRIS value format: could be a standard string or just the transaction ID+Amount for simulation
const qrisValue = computed(() => {
    if (!currentTransaction.value) return '';
    return `KASIR-APP-QRIS-${currentTransaction.value.id}-${currentTransaction.value.totalAmount}`;
})

// User Info
const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

// ...

const checkout = async () => {
  if (cart.value.length === 0) return

  // Validate Cash Sufficiency
  if (paymentMethod.value === 'CASH' && cashReceived.value < finalTotal.value) {
    warning('Uang pembayaran kurang!')
    return
  }
  
  processingPayment.value = true
  try {
    // ... payload construction ...
    const payload = {
      totalAmount: Number(finalTotal.value), 
      paymentMethod: paymentMethod.value, 
      note: note.value,
      discountId: selectedDiscountId.value ? Number(selectedDiscountId.value) : null,
      items: cart.value.map(item => ({
        id: item.id,
        quantity: Number(item.quantity),
        price: Number(item.sellingPrice),
        costPrice: Number(item.costPrice)
      }))
    }

    const res = await api.post('/transactions', payload)
    const transaction = res.data

    if (paymentMethod.value === 'QRIS') {
        currentTransaction.value = transaction
        showQrisModal.value = true
    } else {
        currentTransaction.value = transaction
        await finishTransactionSuccess()
    }

  } catch (err) {
    console.error('Checkout error:', err)
    error(err.response?.data?.error || 'Transaksi Gagal')
  } finally {
    if (paymentMethod.value !== 'QRIS') {
        processingPayment.value = false
    }
  }
}

// ...

const receiptData = ref(null)
const storeSettings = ref(null)

const fetchSettings = async () => {
    try {
        const res = await api.get('/settings')
        storeSettings.value = res.data
    } catch (error) {
        console.error('Error fetching settings:', error)
    }
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

const printReceipt = async () => {
    const trx = currentTransaction.value
    if (!trx) return 
    
    // Ensure settings are loaded or use defaults
    const settings = storeSettings.value || {}

    const dateObj = new Date() 
    
    receiptData.value = {
        orderId: trx.orderId || trx.id, 
        date: dateObj.toLocaleDateString('id-ID'),
        time: dateObj.toLocaleTimeString('id-ID'),
        cashier: user.value?.name || 'Admin', 
        items: cart.value.map(i => ({
            name: i.name,
            qty: i.quantity,
            price: i.sellingPrice
        })),
        total: cartTotal.value,
        discount: discountAmount.value,
        finalTotal: finalTotal.value,
        paymentMethod: paymentMethod.value,
        cash: cashReceived.value,
        change: change.value,
        note: note.value
    }

    await nextTick()
    window.print()
}

const finishTransactionSuccess = async () => {
    await fetchItems() // Reload stock
    
    // Prepare receipt data for printing if not already done
    if (!receiptData.value) {
         // If direct success without modal (Cash), we need to ensure receipt data is ready
         // But usually printReceipt handles it.
         // Let's just print.
    }
    
    // await printReceipt() // Auto-print disabled by user request
    
    // Clear state
    cart.value = []
    cashReceived.value = 0 
    note.value = '' 
    selectedDiscountId.value = '' 
    currentTransaction.value = null
    receiptData.value = null
    
    success('Transaksi Berhasil!')
}

const simulateQrisSuccess = async () => {
    if (!currentTransaction.value) return
    try {
        await api.patch(`/transactions/${currentTransaction.value.id}/status`, {
            status: 'SUCCESS'
        })
        showQrisModal.value = false
        // currentTransaction is needed for receipt, don't null it yet
        processingPayment.value = false
        await finishTransactionSuccess()
    } catch (err) {
        console.error("Simulation error", err)
        error('Gagal simulasi pembayaran')
    }
}

const cancelQris = async () => {
     if (!currentTransaction.value) return
     try {
        await api.patch(`/transactions/${currentTransaction.value.id}/status`, {
            status: 'FAILED'
        })
        showQrisModal.value = false
        currentTransaction.value = null
        processingPayment.value = false
        warning('Pembayaran Dibatalkan. Stok dikembalikan.')
        await fetchItems() 
    } catch (error) {
        console.error("Cancel error", error)
    }
}

onMounted(() => {
  fetchItems()
  fetchCategories()
  fetchSettings()
  fetchDiscounts()
})
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col lg:flex-row h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] gap-6">
      
      <!-- Left Side: Product Grid (Unchanged) -->
      <!-- Left Side: Product Grid -->
      <div class="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6">
        <!-- Search & Filter -->
        <div class="flex flex-col sm:flex-row gap-4 mb-6">
           <div class="relative flex-1 group">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Cari produk..." 
              class="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-gray-50/50 hover:bg-white transition-all text-sm font-medium"
            />
          </div>
          <div class="w-full sm:w-56 overflow-x-auto flex sm:block gap-2 pb-2 sm:pb-0">
            <select 
              v-model="selectedCategory"
              class="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-gray-50/50 cursor-pointer text-sm font-medium hover:bg-white transition-all"
            >
              <option value="">Semua Kategori</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
        </div>

         <!-- Grid -->
        <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-gray-400">
             <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
             <p>Memuat produk...</p>
          </div>
          <div v-else-if="filteredItems.length === 0" class="flex flex-col items-center justify-center py-20 text-gray-400">
             <ShoppingBag class="w-16 h-16 opacity-10 mb-4"/>
             <p>Tidak ada produk ditemukan</p>
          </div>
          
          <div v-else class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            <div 
              v-for="item in filteredItems" 
              :key="item.id"
              @click="addToCart(item)"
              class="group relative bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-blue-100 transition-all duration-300 cursor-pointer h-full flex flex-col overflow-hidden ring-1 ring-transparent hover:ring-blue-50"
              :class="{'opacity-60 grayscale cursor-not-allowed': item.stock <= 0}"
            >
              <!-- Stock Badge -->
              <div class="absolute top-3 right-3 z-10">
                <span 
                  :class="[
                    'text-[10px] uppercase font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm',
                    item.stock > 0 ? 'bg-green-100/80 text-green-700' : 'bg-red-100/80 text-red-700'
                  ]"
                >
                  {{ item.stock > 0 ? `Stok: ${item.stock}` : 'Habis' }}
                </span>
              </div>

                <div class="w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center mb-4 group-hover:from-blue-50 group-hover:to-blue-100 transition-colors duration-300 relative overflow-hidden">
                 <img 
                    v-if="item.image" 
                    :src="`${api.defaults.baseURL.replace('/api', '')}${item.image}`" 
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                 />
                 <ShoppingBag v-else class="w-10 h-10 text-gray-300 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-300 ease-out" /> 
                <!-- Gradient Overlay on Hover -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              <div class="space-y-1">
                  <h3 class="font-bold text-gray-800 line-clamp-2 text-sm leading-snug group-hover:text-blue-600 transition-colors">{{ item.name }}</h3>
                  <div class="flex items-center justify-between pt-1">
                      <p class="text-blue-600 font-extrabold text-base">Rp {{ Number(item.sellingPrice).toLocaleString() }}</p>
                      <button class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          <Plus class="w-4 h-4" />
                      </button>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side: Cart -->
      <div class="w-full lg:w-96 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[60vh] lg:h-full">
        <div class="p-4 border-b border-gray-100">
          <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart class="w-5 h-5 text-blue-600" />
            Keranjang Belanja
          </h2>
        </div>

        <!-- Cart Items -->
         <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
            <ShoppingCart class="w-12 h-12 opacity-20" />
            <p>Keranjang kosong</p>
          </div>
          
          <div 
            v-for="item in cart" 
            :key="item.id" 
            class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
          >
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-gray-800 truncate">{{ item.name }}</h4>
              <p class="text-sm text-blue-600 font-semibold">Rp {{ Number(item.sellingPrice).toLocaleString() }}</p>
            </div>
            
            <div class="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
              <button 
                @click="updateQuantity(item.id, -1)"
                class="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded transition-colors"
                :class="{'text-red-500 hover:text-red-600 hover:bg-red-50': item.quantity === 1}"
              >
                <Minus v-if="item.quantity > 1" class="w-3 h-3" />
                <Trash2 v-else class="w-3 h-3" />
              </button>
              <span class="text-sm font-semibold w-6 text-center">{{ item.quantity }}</span>
              <button 
                @click="updateQuantity(item.id, 1)"
                class="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded transition-colors"
                :disabled="item.quantity >= item.stock"
                :class="{'opacity-50 cursor-not-allowed': item.quantity >= item.stock}"
              >
                <Plus class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <!-- Note Input (New) -->
        <div class="px-4 pb-0">
             <textarea 
                v-model="note"
                rows="1" 
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-100 focus:border-blue-400 outline-none bg-white placeholder-gray-400 resize-none transition-all"
                placeholder="Catatan Transaksi (Opsional)..."
             ></textarea>
        </div>

        <div class="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl space-y-4">
          <!-- Discount Selection -->
          <div>
              <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Diskon / Promo</label>
              <select v-model="selectedDiscountId" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-100 focus:border-blue-400 outline-none bg-white">
                  <option value="">Tidak ada diskon</option>
                  <option v-for="disc in discounts" :key="disc.id" :value="disc.id">
                      {{ disc.name }} ({{ disc.type === 'PERCENTAGE' ? `${disc.value}%` : `Rp ${Number(disc.value).toLocaleString()}` }})
                  </option>
              </select>
          </div>

          <!-- Totals Breakdown -->
          <div class="space-y-1">
              <div class="flex justify-between items-center text-sm text-gray-600">
                <span>Subtotal</span>
                <span>Rp {{ cartTotal.toLocaleString() }}</span>
              </div>
              <div v-if="discountAmount > 0" class="flex justify-between items-center text-sm text-green-600 font-medium">
                <span>Diskon</span>
                <span>- Rp {{ discountAmount.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between items-center pt-2 border-t border-gray-200">
                <span class="text-gray-800 font-bold">Total Akhir</span>
                <span class="text-2xl font-bold text-gray-800">Rp {{ finalTotal.toLocaleString() }}</span>
              </div>
          </div>

          <!-- Payment Method -->
          <div class="bg-white p-3 rounded-lg border border-gray-200">
             <div class="flex gap-2 mb-3">
                <button 
                    @click="paymentMethod = 'CASH'"
                    class="flex-1 py-2 text-sm font-medium rounded-md transition-colors border"
                    :class="paymentMethod === 'CASH' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50'"
                >
                    Tunai (CASH)
                </button>
                <button 
                    @click="paymentMethod = 'QRIS'"
                    class="flex-1 py-2 text-sm font-medium rounded-md transition-colors border"
                    :class="paymentMethod === 'QRIS' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50'"
                >
                    QRIS
                </button>
             </div>

             <!-- Cash Input Section -->
             <div v-if="paymentMethod === 'CASH'" class="space-y-3 pt-2 border-t border-gray-100">
                <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase">Uang Diterima</label>
                    <input 
                        v-model.number="cashReceived"
                        type="number" 
                        class="w-full text-right font-bold text-gray-800 border-b-2 border-gray-200 focus:border-blue-500 outline-none py-1 text-lg bg-transparent"
                        placeholder="0"
                    />
                </div>
                
                <div class="grid grid-cols-4 gap-2">
                    <button @click="addCash(10000)" class="px-1 py-2 bg-gray-50 hover:bg-gray-100 rounded text-xs font-medium text-gray-600 transition-colors">+10k</button>
                    <button @click="addCash(20000)" class="px-1 py-2 bg-gray-50 hover:bg-gray-100 rounded text-xs font-medium text-gray-600 transition-colors">+20k</button>
                    <button @click="addCash(50000)" class="px-1 py-2 bg-gray-50 hover:bg-gray-100 rounded text-xs font-medium text-gray-600 transition-colors">+50k</button>
                    <button @click="addCash(100000)" class="px-1 py-2 bg-gray-50 hover:bg-gray-100 rounded text-xs font-medium text-gray-600 transition-colors">+100k</button>
                </div>

                <div v-if="change > 0" class="flex justify-between items-center bg-green-50 p-2 rounded text-sm">
                    <span class="text-green-700 font-medium">Kembalian:</span>
                    <span class="text-green-700 font-bold">Rp {{ change.toLocaleString() }}</span>
                </div>
             </div>
          </div>
          
          <button 
            @click="checkout"
            :disabled="cart.length === 0 || processingPayment || (paymentMethod === 'CASH' && cashReceived < finalTotal)"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200"
          >
             <span v-if="processingPayment">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            <span v-else class="flex items-center gap-2">
              <CreditCard v-if="paymentMethod === 'CASH'" class="w-5 h-5" />
              <QrCode v-else class="w-5 h-5" />
              {{ paymentMethod === 'CASH' ? 'Bayar Tunai' : 'Bayar via QRIS' }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- QRIS Modal -->
    <div v-if="showQrisModal" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col items-center">
            
            <div class="w-full flex justify-end p-4">
                  <button @click="cancelQris" class="text-gray-400 hover:text-gray-600"><X class="w-6 h-6" /></button>
            </div>

            <div class="px-8 pb-8 flex flex-col items-center text-center">
                <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-2">Transaksi Berhasil!</h3>
                <p class="text-gray-500 mb-6">Pembayaran telah dikonfirmasi.</p>
                <p class="text-lg font-mono font-bold text-gray-700 bg-gray-50 px-4 py-2 rounded mb-6">ID: {{ currentTransaction?.orderId }}</p>

                <div class="flex gap-3 w-full">
                    <button 
                        @click="printReceipt" 
                        class="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <Printer class="w-5 h-5" />
                        Cetak Struk
                    </button>
                    <button 
                        @click="finishTransactionSuccess" 
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-100 transition-colors"
                    >
                        Selesai
                    </button>
                </div>
            </div>
        </div>
    </div>
  </DashboardLayout>
  <ReceiptPrint v-if="receiptData" :data="receiptData" :settings="storeSettings" />
</template>

<style>
@media print {
    body * {
        visibility: hidden;
    }
    #receipt-print, #receipt-print * {
        visibility: visible;
    }
    #receipt-print {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 15px;
    }
}
</style>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #d1d5db;
}
</style>
