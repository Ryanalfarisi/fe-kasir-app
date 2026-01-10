<script setup>
import { ref, onMounted } from 'vue';
import api from '../api';
import AppModal from '../components/AppModal.vue';
import DashboardLayout from '../layouts/DashboardLayout.vue';
import { PencilIcon, TrashIcon, PlusIcon, TagIcon } from 'lucide-vue-next';
import { useToast } from '../composables/useToast';

const discounts = ref([]);
const loading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const { success, error } = useToast();

const form = ref({
  id: null,
  name: '',
  type: 'PERCENTAGE', // PERCENTAGE, FIXED
  value: 0,
  isActive: true,
});

const fetchDiscounts = async () => {
  loading.value = true;
  try {
    const res = await api.get('/discounts');
    discounts.value = res.data;
  } catch (err) {
    console.error(err);
    error('Gagal mengambil data diskon');
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  isEditing.value = false;
  form.value = {
    id: null,
    name: '',
    type: 'PERCENTAGE',
    value: 0,
    isActive: true,
  };
  showModal.value = true;
};

const openEditModal = (item) => {
  isEditing.value = true;
  form.value = {
    id: item.id,
    name: item.name,
    type: item.type,
    value: Number(item.value),
    isActive: item.isActive,
  };
  showModal.value = true;
};

const saveDiscount = async () => {
  try {
    if (isEditing.value) {
      await api.put(`/discounts/${form.value.id}`, form.value);
      success('Diskon berhasil diperbarui');
    } else {
      await api.post('/discounts', form.value);
      success('Diskon berhasil ditambahkan');
    }
    showModal.value = false;
    fetchDiscounts();
  } catch (err) {
    console.error(err);
    error('Gagal menyimpan diskon');
  }
};

const deleteDiscount = async (id) => {
  if (!confirm('Hapus diskon ini?')) return;
  try {
    await api.delete(`/discounts/${id}`);
    success('Diskon berhasil dihapus');
    fetchDiscounts();
  } catch (err) {
    console.error(err);
    error('Gagal menghapus diskon');
  }
};

const formatValue = (val, type) => {
    if (type === 'PERCENTAGE') return `${val}%`;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
};

onMounted(() => {
  fetchDiscounts();
});
</script>

<template>
  <DashboardLayout>
    <div>
      <div class="flex justify-between items-center mb-6">
        <div>
            <h2 class="text-2xl font-bold text-gray-800">Manajemen Diskon</h2>
            <p class="text-gray-500">Buat promo dan potongan harga</p>
        </div>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-bold" @click="openAddModal">
          <PlusIcon size="16" class="mr-2"/> Tambah Diskon
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-8 text-center text-gray-500">
        <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        Memuat data...
      </div>

      <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="py-3 px-4 font-semibold text-gray-600 text-sm">Nama Diskon</th>
                <th class="py-3 px-4 font-semibold text-gray-600 text-sm">Tipe</th>
                <th class="py-3 px-4 font-semibold text-gray-600 text-sm text-right">Nilai</th>
                <th class="py-3 px-4 font-semibold text-gray-600 text-sm text-center">Status</th>
                <th class="py-3 px-4 font-semibold text-gray-600 text-sm text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in discounts" :key="item.id" class="hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                            <TagIcon class="w-4 h-4" />
                        </div>
                        <span class="font-medium text-gray-800">{{ item.name }}</span>
                    </div>
                </td>
                <td class="py-3 px-4 text-sm text-gray-600">
                    {{ item.type === 'PERCENTAGE' ? 'Persentase (%)' : 'Potongan Harga (Rp)' }}
                </td>
                <td class="py-3 px-4 text-right font-bold text-gray-800">{{ formatValue(item.value, item.type) }}</td>
                <td class="py-3 px-4 text-center">
                    <span :class="['px-2 py-1 rounded-full text-xs font-bold', item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">
                        {{ item.isActive ? 'Aktif' : 'Non-Aktif' }}
                    </span>
                </td>
                <td class="py-3 px-4 text-center">
                  <div class="flex justify-center gap-2">
                    <button class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" @click="openEditModal(item)">
                      <PencilIcon size="16" />
                    </button>
                    <button class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" @click="deleteDiscount(item.id)">
                      <TrashIcon size="16" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="discounts.length === 0">
                  <td colspan="5" class="py-8 text-center text-gray-500">Belum ada diskon dibuat.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <AppModal :show="showModal" :title="isEditing ? 'Edit Diskon' : 'Tambah Diskon'" @close="showModal = false">
        <form @submit.prevent="saveDiscount">
          <div class="form-group mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Diskon</label>
            <input v-model="form.name" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required placeholder="Contoh: Promo Merdeka" />
          </div>
          
          <div class="form-group mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipe Diskon</label>
            <select v-model="form.type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="PERCENTAGE">Persentase (%)</option>
                <option value="FIXED">Potongan Tetap (Rp)</option>
            </select>
          </div>

          <div class="form-group mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Nilai</label>
            <input v-model.number="form.value" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required min="0" />
            <p class="text-xs text-gray-500 mt-1" v-if="form.type === 'PERCENTAGE'">Masukkan angka 1-100</p>
          </div>

          <div class="flex items-center gap-2 mb-6">
              <input type="checkbox" v-model="form.isActive" id="isActive" class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
              <label for="isActive" class="text-sm text-gray-700">Status Aktif</label>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button type="button" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium" @click="showModal = false">Batal</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">{{ isEditing ? 'Simpan Perubahan' : 'Simpan' }}</button>
          </div>
        </form>
      </AppModal>
    </div>
  </DashboardLayout>
</template>
