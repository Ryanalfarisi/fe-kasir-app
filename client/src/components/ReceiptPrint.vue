<script setup>
import { computed } from 'vue'
// Removed internal API fetch

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  settings: {
    type: Object,
    required: false, // Optional, falls back to defaults
    default: () => ({
        storeName: 'KASIR APP',
        storeAddress: 'Jl. Contoh No. 123, Jakarta',
        storePhone: '0812-3456-7890',
        receiptFooter: 'Terima kasih atas kunjungan Anda!',
        storeLogo: null
    })
  }
})

const formatCurrency = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

const logoUrl = computed(() => {
    if (props.settings && props.settings.storeLogo) {
        return `${import.meta.env.VITE_API_URL}${props.settings.storeLogo}`
    }
    return null
})
</script>

<template>
    <div id="receipt-print" class="hidden print:block fixed inset-0 bg-white z-[9999] p-4 text-black font-mono text-sm leading-tight">
        <div class="text-center mb-4 flex flex-col items-center">
            <img v-if="logoUrl" :src="logoUrl" class="h-16 w-auto mb-2 object-contain" />
            <h1 class="font-bold text-xl uppercase tracking-wider">{{ settings.storeName }}</h1>
            <p class="text-xs whitespace-pre-line">{{ settings.storeAddress }}</p>
            <p class="text-xs">Telp: {{ settings.storePhone }}</p>
        </div>
        
        <div class="border-b border-black border-dashed mb-2 pb-2">
            <div class="flex justify-between">
                <span>{{ data.orderId }}</span>
                <span>{{ data.date }}</span>
            </div>
            <div class="flex justify-between">
                <span>Kasir: {{ data.cashier }}</span>
                <span>{{ data.time }}</span>
            </div>
        </div>

        <div class="mb-4">
            <div v-for="(item, index) in data.items" :key="index" class="flex justify-between mb-1">
                <div>
                    <div>{{ item.name }}</div>
                    <div class="text-xs text-gray-500">{{ item.qty }} x {{ formatCurrency(item.price) }}</div>
                </div>
                <div class="font-bold">{{ formatCurrency(item.price * item.qty) }}</div>
            </div>
        </div>

        <div class="border-t border-b border-dashed border-gray-300 py-2 mb-4">
            <div class="flex justify-between text-base mb-1">
                <span>Subtotal</span>
                <span>{{ formatCurrency(data.total) }}</span>
            </div>
            <div v-if="data.discount > 0" class="flex justify-between text-base mb-1">
                <span>Diskon</span>
                <span>-{{ formatCurrency(data.discount) }}</span>
            </div>
            <div class="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{{ formatCurrency(data.finalTotal || data.total) }}</span>
            </div>
        </div>

        <div v-if="data.paymentMethod === 'CASH'" class="flex justify-between text-sm">
            <span>Tunai</span>
            <span>{{ formatCurrency(data.cash || data.total) }}</span>
        </div>
        <div v-if="data.paymentMethod === 'CASH'" class="flex justify-between text-sm">
            <span>Kembali</span>
            <span>{{ formatCurrency(data.change || 0) }}</span>
        </div>
        <div v-else class="flex justify-between text-sm">
            <span>Metode</span>
            <span>{{ data.paymentMethod }}</span>
        </div>
        
        <!-- Transaction Note -->
        <div v-if="data.note" class="mb-4 pt-2 border-t border-black border-dashed">
            <p class="font-bold text-xs uppercase mb-1">Catatan:</p>
            <p class="text-xs italic">{{ data.note }}</p>
        </div>

        <div class="text-center text-xs mt-8">
            <p class="whitespace-pre-line">{{ settings.receiptFooter }}</p>
        </div>
    </div>
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
