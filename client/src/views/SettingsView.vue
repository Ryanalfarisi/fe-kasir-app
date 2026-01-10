<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { Save, Upload, Info } from 'lucide-vue-next'
import { useToast } from '../composables/useToast' // Import

const { success, error } = useToast() // Destructure

const settings = ref({
    storeName: '',
    storeAddress: '',
    storePhone: '',
    receiptFooter: '',
    storeLogo: null
})


// ...

const loading = ref(true)
const saving = ref(false)
const logoFile = ref(null)
const logoPreview = ref(null)

const fetchSettings = async () => {
    loading.value = true
    try {
        const res = await api.get('/settings')
        settings.value = res.data
        if (settings.value.storeLogo) {
            logoPreview.value = `${import.meta.env.VITE_API_URL}${settings.value.storeLogo}`
        }
    } catch (error) {
        console.error('Error fetching settings:', error)
    } finally {
        loading.value = false
    }
}

const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
        logoFile.value = file
        logoPreview.value = URL.createObjectURL(file)
    }
}

const saveSettings = async () => {
    saving.value = true
    try {
        const formData = new FormData()
        formData.append('storeName', settings.value.storeName)
        formData.append('storeAddress', settings.value.storeAddress)
        formData.append('storePhone', settings.value.storePhone)
        formData.append('receiptFooter', settings.value.receiptFooter)
        
        if (logoFile.value) {
            formData.append('logo', logoFile.value)
        }

        const res = await api.post('/settings', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        
        settings.value = res.data
        success('Pengaturan berhasil disimpan!') // Toast
    } catch (err) {
        console.error('Save error:', err)
        error('Gagal menyimpan pengaturan') // Toast
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    fetchSettings()
})
</script>

<template>
    <DashboardLayout>
        <div class="max-w-4xl mx-auto">
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Pengaturan Toko</h1>
                <p class="text-gray-600">Sesuaikan informasi struk dan aplikasi</p>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="p-6 md:p-8 space-y-8">
                    
                    <!-- LOGO SECTION -->
                    <div>
                         <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Upload class="w-5 h-5 text-blue-600" />
                            Logo Struk
                         </h3>
                         <div class="flex items-start gap-6">
                             <div class="w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center overflow-hidden relative group">
                                 <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-contain p-2" />
                                 <div v-else class="text-gray-400 text-xs text-center p-2">
                                     Upload Logo
                                 </div>
                             </div>
                             <div class="flex-1">
                                 <p class="text-sm text-gray-600 mb-2">Format: JPG, PNG. Maks 2MB. Disarankan rasio 1:1 atau persegi panjang.</p>
                                 <input 
                                    type="file" 
                                    accept="image/*"
                                    @change="handleFileChange"
                                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                             </div>
                         </div>
                    </div>

                    <div class="border-t border-gray-100"></div>

                    <!-- INFO SECTION -->
                    <div>
                         <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Info class="w-5 h-5 text-blue-600" />
                            Informasi Toko
                         </h3>
                         <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                 <label class="block text-sm font-medium text-gray-700 mb-1">Nama Toko *</label>
                                 <input v-model="settings.storeName" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" placeholder="Contoh: Toko Berkah" />
                             </div>
                             <div>
                                 <label class="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                                 <input v-model="settings.storePhone" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" placeholder="0812-XXXX-XXXX" />
                             </div>
                             <div class="md:col-span-2">
                                 <label class="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                                 <textarea v-model="settings.storeAddress" rows="2" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" placeholder="Alamat lengkap toko..."></textarea>
                             </div>
                             <div class="md:col-span-2">
                                 <label class="block text-sm font-medium text-gray-700 mb-1">Footer Struk</label>
                                 <textarea v-model="settings.receiptFooter" rows="2" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" placeholder="Pesan di bagian bawah struk..."></textarea>
                                 <p class="text-xs text-gray-500 mt-1">Misal: "Barang yang sudah dibeli tidak dapat ditukar"</p>
                             </div>
                         </div>
                    </div>

                    <!-- ACTION -->
                    <div class="pt-4 border-t border-gray-100 flex justify-end">
                        <button 
                            @click="saveSettings" 
                            :disabled="saving"
                            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <span v-if="saving" class="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                            <Save v-else class="w-5 h-5" />
                            Simpan Perubahan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </DashboardLayout>
</template>
