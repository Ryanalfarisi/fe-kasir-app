<script setup>
import { ref, onMounted, computed } from "vue";
import api from "../api"; // Use shared API instance
import DashboardLayout from "../layouts/DashboardLayout.vue";
import { User, Shield, Trash2, Edit, Plus, Users } from "lucide-vue-next";

const users = ref([]);
const loading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const currentUserRole = ref("");
const errorMessage = ref("");

const form = ref({
  id: null,
  name: "",
  username: "",
  password: "",
  role: "KASIR",
});

// authAxios replaced by global api instance

const fetchUsers = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await api.get("/users");
    users.value = response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    if (error.response?.status === 403) {
      errorMessage.value = "Anda tidak memiliki izin untuk melihat data ini.";
    } else {
      errorMessage.value = "Gagal mengambil data karyawan.";
    }
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  isEditing.value = false;
  form.value = {
    id: null,
    name: "",
    username: "",
    password: "", // New user needs password
    role: "KASIR",
  };
  showModal.value = true;
};

const openEditModal = (user) => {
  isEditing.value = true;
  form.value = {
    id: user.id,
    name: user.name,
    username: user.username,
    password: "", // Leave empty to keep unchanged
    role: user.role,
  };
  showModal.value = true;
};

const saveUser = async () => {
  try {
    if (isEditing.value) {
      await api.put(`/users/${form.value.id}`, form.value);
    } else {
      await api.post("/users", form.value);
    }
    showModal.value = false;
    fetchUsers();
  } catch (error) {
    console.error("Error saving user:", error);
    alert(error.response?.data?.error || "Gagal menyimpan data");
  }
};

const deleteUser = async (id) => {
  if (
    !confirm("Hapus karyawan ini? Data yang dihapus tidak bisa dikembalikan.")
  )
    return;
  try {
    await api.delete(`/users/${id}`);
    fetchUsers();
  } catch (error) {
    console.error("Error deleting user:", error);
    alert("Gagal menghapus karyawan");
  }
};

onMounted(() => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  currentUserRole.value = user.role;
  fetchUsers();
});
</script>

<template>
  <DashboardLayout>
    <div
      class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users class="w-8 h-8 text-blue-600" />
          Data Karyawan
        </h1>
        <p class="text-gray-600 mt-1">Kelola akses pengguna sistem</p>
      </div>
      <button
        @click="openAddModal"
        class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-200"
      >
        <Plus class="w-5 h-5" />
        Tambah Karyawan
      </button>
    </div>

    <!-- Error State -->
    <div
      v-if="errorMessage"
      class="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-6 flex items-center gap-3"
    >
      <Shield class="w-6 h-6" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Users Table -->
    <div
      v-else
      class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="p-4 font-semibold text-gray-600">Nama Lengkap</th>
              <th class="p-4 font-semibold text-gray-600">Username</th>
              <th class="p-4 font-semibold text-gray-600">Role</th>
              <th class="p-4 font-semibold text-gray-600 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading" class="text-center py-8">
              <td colspan="4" class="p-8 text-gray-500">Loading users...</td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="4" class="p-8 text-center text-gray-500">
                Tidak ada karyawan ditemukan
              </td>
            </tr>
            <tr
              v-for="user in users"
              :key="user.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-gray-100 rounded-full text-gray-500">
                    <User class="w-4 h-4" />
                  </div>
                  <span class="font-medium text-gray-800">{{ user.name }}</span>
                </div>
              </td>
              <td class="p-4 text-gray-600">@{{ user.username }}</td>
              <td class="p-4">
                <span
                  :class="[
                    'px-2 py-1 rounded-full text-xs font-bold uppercase',
                    user.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-green-100 text-green-700',
                  ]"
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="p-4 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    @click="openEditModal(user)"
                    class="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteUser(user.id)"
                    class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus"
                    :disabled="user.username === 'admin'"
                    :class="{
                      'opacity-50 cursor-not-allowed':
                        user.username === 'admin',
                    }"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div
          class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center"
        >
          <h3 class="font-bold text-gray-800">
            {{ isEditing ? "Edit Karyawan" : "Tambah Karyawan" }}
          </h3>
          <button
            @click="showModal = false"
            class="text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        </div>

        <form @submit.prevent="saveUser" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Nama Lengkap</label
            >
            <input
              v-model="form.name"
              required
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Nama Karyawan"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Username</label
            >
            <input
              v-model="form.username"
              required
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Username untuk login"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Password
              <span v-if="isEditing" class="text-xs text-gray-400 font-normal"
                >(Kosongkan jika tidak ingin ubah)</span
              >
            </label>
            <input
              v-model="form.password"
              :required="!isEditing"
              type="password"
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="*****"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Role / Jabatan</label
            >
            <select
              v-model="form.role"
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="KASIR">KASIR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button
              type="button"
              @click="showModal = false"
              class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  </DashboardLayout>
</template>
