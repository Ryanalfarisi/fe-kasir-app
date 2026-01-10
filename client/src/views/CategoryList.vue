<script setup>
import { ref, onMounted } from 'vue';
import api from '../api';
import AppModal from '../components/AppModal.vue';
import DashboardLayout from '../layouts/DashboardLayout.vue';
import { PencilIcon, TrashIcon, PlusIcon } from 'lucide-vue-next';

const categories = ref([]);
const loading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const form = ref({ id: null, name: '' });

const fetchCategories = async () => {
  loading.value = true;
  try {
    const res = await api.get('/categories');
    categories.value = res.data;
  } catch (err) {
    console.error(err);
    alert('Gagal mengambil data kategori');
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  isEditing.value = false;
  form.value = { id: null, name: '' };
  showModal.value = true;
};

const openEditModal = (cat) => {
  isEditing.value = true;
  form.value = { id: cat.id, name: cat.name };
  showModal.value = true;
};

const saveCategory = async () => {
  if (!form.value.name) return alert('Nama kategori harus diisi');
  
  try {
    if (isEditing.value) {
      await api.put(`/categories/${form.value.id}`, { name: form.value.name });
    } else {
      await api.post('/categories', { name: form.value.name });
    }
    showModal.value = false;
    fetchCategories();
  } catch (err) {
    console.error(err);
    alert('Gagal menyimpan kategori');
  }
};

const deleteCategory = async (id) => {
  if (!confirm('Apakah anda yakin ingin menghapus kategori ini?')) return;
  try {
    await api.delete(`/categories/${id}`);
    fetchCategories();
  } catch (err) {
    console.error(err);
    alert('Gagal menghapus kategori. Pastikan tidak ada barang yang menggunakan kategori ini.');
  }
};

onMounted(fetchCategories);
</script>

<template>
  <DashboardLayout>
    <div>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-text-main">Daftar Kategori</h2>
        <button class="btn btn-primary" @click="openAddModal">
          <PlusIcon size="16" class="mr-2"/> Tambah Kategori
        </button>
      </div>

      <div class="card overflow-hidden">
        <div class="table-wrapper">
          <table v-if="categories.length > 0">
            <thead>
              <tr class="bg-gray-50 border-b border-border">
                <th class="py-3 px-4 font-semibold text-text-muted text-sm text-left">ID</th>
                <th class="py-3 px-4 font-semibold text-text-muted text-sm text-left w-full">Nama Kategori</th>
                <th class="py-3 px-4 font-semibold text-text-muted text-sm text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="cat in categories" :key="cat.id" class="hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4 text-sm text-text-muted">#{{ cat.id }}</td>
                <td class="py-3 px-4 font-medium">{{ cat.name }}</td>
                <td class="py-3 px-4">
                  <div class="flex justify-center gap-2">
                    <button class="btn-icon" @click="openEditModal(cat)">
                      <PencilIcon size="16" />
                    </button>
                    <button class="btn-icon danger" @click="deleteCategory(cat.id)">
                      <TrashIcon size="16" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="text-center py-12 text-text-muted">
            <p>Belum ada kategori. Silakan tambah kategori baru.</p>
          </div>
        </div>
      </div>

      <AppModal :show="showModal" :title="isEditing ? 'Edit Kategori' : 'Tambah Kategori'" @close="showModal = false">
        <form @submit.prevent="saveCategory">
          <div class="form-group">
            <label class="form-label">Nama Kategori</label>
            <input v-model="form.name" class="form-input" placeholder="Contoh: Minuman" required />
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
