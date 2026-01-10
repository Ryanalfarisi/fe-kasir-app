<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../api';
import AppModal from '../components/AppModal.vue';
import DashboardLayout from '../layouts/DashboardLayout.vue';
import { PencilIcon, TrashIcon, PlusIcon, SearchIcon, Upload, ImageIcon } from 'lucide-vue-next';

const items = ref([]);
const categories = ref([]);
const loading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const searchQuery = ref('');
const selectedCategoryFilter = ref('');

const form = ref({
  id: null,
  name: '',
  costPrice: 0,
  sellingPrice: 0,
  discount: 0,
  stock: 0,
  categoryId: '',
  id: null,
  name: '',
  costPrice: 0,
  id: null,
  name: '',
  costPrice: 0,
  sellingPrice: 0,
  stock: 0,
  categoryId: '',
  image: null
});

const imageFile = ref(null);
const imagePreview = ref(null);

const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        imageFile.value = file;
        imagePreview.value = URL.createObjectURL(file);
    }
};

const fetchItems = async () => {
  loading.value = true;
  try {
    const res = await api.get('/items');
    items.value = res.data;
  } catch (err) {
    console.error(err);
    alert('Gagal mengambil data barang');
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const res = await api.get('/categories');
    categories.value = res.data;
  } catch (err) {
    console.error(err);
  }
};

const filteredItems = computed(() => {
  return items.value.filter(item => {
    const matchName = item.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchCat = selectedCategoryFilter.value ? item.categoryId === selectedCategoryFilter.value : true;
    return matchName && matchCat;
  });
});

const openAddModal = () => {
  isEditing.value = false;
  form.value = {
    id: null,
    name: '',
    costPrice: 0,
    sellingPrice: 0,
    stock: 0,
    categoryId: categories.value.length > 0 ? categories.value[0].id : '',
  };
  imageFile.value = null;
  imagePreview.value = null;
  showModal.value = true;
};

const openEditModal = (item) => {
  isEditing.value = true;
  form.value = {
    id: item.id,
    name: item.name,
    costPrice: Number(item.costPrice),
    sellingPrice: Number(item.sellingPrice),
    stock: Number(item.stock),
    categoryId: item.categoryId,
  };
  imageFile.value = null;
  if (item.image) {
      imagePreview.value = `${import.meta.env.VITE_API_URL}${item.image}`;
  } else {
      imagePreview.value = null;
  }
  showModal.value = true;
};

const saveItem = async () => {
  if (!form.value.name || !form.value.categoryId) return alert('Nama dan Kategori harus diisi');
  
  try {
    const formData = new FormData();
    formData.append('name', form.value.name);
    formData.append('costPrice', form.value.costPrice);
    formData.append('sellingPrice', form.value.sellingPrice);
    formData.append('stock', form.value.stock);
    formData.append('categoryId', form.value.categoryId);
    
    if (imageFile.value) {
        formData.append('image', imageFile.value);
    }

    if (isEditing.value) {
      await api.put(`/items/${form.value.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else {
      await api.post('/items', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    showModal.value = false;
    fetchItems();
  } catch (err) {
    console.error(err);
    alert('Gagal menyimpan barang');
  }
};

const deleteItem = async (id) => {
  if (!confirm('Apakah anda yakin ingin menghapus barang ini?')) return;
  try {
    await api.delete(`/items/${id}`);
    fetchItems();
  } catch (err) {
    console.error(err);
    alert('Gagal menghapus barang');
  }
};

const formatCurrency = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
};

onMounted(() => {
  fetchItems();
  fetchCategories();
});
</script>

<template>
  <DashboardLayout>
    <div>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-text-main">Daftar Barang</h2>
        <button class="btn btn-primary" @click="openAddModal">
          <PlusIcon size="16" class="mr-2"/> Tambah Barang
        </button>
      </div>

      <div class="card mb-6 p-4 sticky top-[73px] z-10 border border-border">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="relative flex-1">
            <SearchIcon size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"/>
            <input v-model="searchQuery" class="form-input pl-10" placeholder="Cari nama barang..." />
          </div>
          <select v-model="selectedCategoryFilter" class="form-input sm:w-56 cursor-pointer">
            <option value="">Semua Kategori</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="table-wrapper">
          <table v-if="filteredItems.length > 0">
            <thead>
              <tr class="bg-gray-50 border-b border-border">
                <th class="py-3 px-4 font-semibold text-text-muted text-sm text-center w-16">Foto</th>
                <th class="py-3 px-4 font-semibold text-text-muted text-sm text-left">Nama Barang</th>
                <th class="py-3 px-4 font-semibold text-text-muted text-sm text-left">Kategori</th>
                <th class="py-3 px-4 font-semibold text-text-muted text-sm text-right">Modal</th>
                <th class="py-3 px-4 font-semibold text-text-muted text-sm text-right">Jual</th>
                <th class="py-3 px-4 font-semibold text-text-muted text-sm text-center">Stok</th>
                <th class="py-3 px-4 font-semibold text-text-muted text-sm text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="item in filteredItems" :key="item.id" class="hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4 text-center">
                   <div class="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden mx-auto">
                      <img v-if="item.image" :src="`${api.defaults.baseURL.replace('/api', '')}${item.image}`" class="w-full h-full object-cover" />
                      <ImageIcon v-else class="w-5 h-5 text-gray-400" />
                   </div>
                </td>
                <td class="py-3 px-4">
                  <div class="font-medium text-text-main">{{ item.name }}</div>
                </td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {{ item.category?.name || '-' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right tabular-nums">{{ formatCurrency(item.costPrice) }}</td>
                <td class="py-3 px-4 text-right tabular-nums font-medium text-primary">{{ formatCurrency(item.sellingPrice) }}</td>
                <td class="py-3 px-4 text-center">
                    <span :class="['px-2 py-1 rounded-full text-xs font-bold', item.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                        {{ item.stock }}
                    </span>
                </td>
                <td class="py-3 px-4">
                  <div class="flex justify-center gap-2">
                    <button class="btn-icon" @click="openEditModal(item)">
                      <PencilIcon size="16" />
                    </button>
                    <button class="btn-icon danger" @click="deleteItem(item.id)">
                      <TrashIcon size="16" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="text-center py-12 text-text-muted">
            <p class="mb-2">Tidak ada barang ditemukan.</p>
            <p class="text-xs">Coba ubah kata kunci pencarian atau filter kategori.</p>
          </div>
        </div>
      </div>

      <AppModal :show="showModal" :title="isEditing ? 'Edit Barang' : 'Tambah Barang'" @close="showModal = false">
        <form @submit.prevent="saveItem">

          <!-- Image Upload -->
          <div class="mb-4 flex items-center gap-4">
              <div class="w-20 h-20 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                  <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover" />
                  <ImageIcon v-else class="w-8 h-8 text-gray-300" />
                  <input type="file" accept="image/*" @change="handleFileChange" class="absolute inset-0 opacity-0 cursor-pointer" title="Ubah Foto" />
              </div>
              <div class="flex-1">
                  <p class="text-sm font-medium text-gray-700">Foto Produk</p>
                  <p class="text-xs text-gray-500 mb-2">Klik gambar untuk mengubah. Opsional.</p>
              </div>
          </div>

          <div class="form-group">
            <label class="form-label">Nama Barang</label>
            <input v-model="form.name" class="form-input" required placeholder="Contoh: Kopi Susu" />
          </div>
          
          <div class="form-group">
            <label class="form-label">Kategori</label>
            <select v-model="form.categoryId" class="form-input" required>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Harga Modal</label>
              <input v-model.number="form.costPrice" type="number" class="form-input" required min="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Harga Jual</label>
              <input v-model.number="form.sellingPrice" type="number" class="form-input" required min="0" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
             <div class="form-group">
              <label class="form-label">Stok Awal</label>
              <input v-model.number="form.stock" type="number" class="form-input" required min="0" />
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button type="button" class="btn hover:bg-gray-100" @click="showModal = false">Batal</button>
            <button type="submit" class="btn btn-primary">{{ isEditing ? 'Simpan Perubahan' : 'Simpan' }}</button>
          </div>
        </form>
      </AppModal>
    </div>
  </DashboardLayout>
</template>
