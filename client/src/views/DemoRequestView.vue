<script setup>
import { ref, onMounted, computed } from "vue";
import { useToast } from "../composables/useToast";
import api from "../api";
import moment from "moment";
import DashboardLayout from "../layouts/DashboardLayout.vue";

const requests = ref([]);
const loading = ref(false);
const processingId = ref(null);
const { success, error } = useToast();

const fetchRequests = async () => {
  loading.value = true;
  try {
    const res = await api.get("/demo-requests");
    requests.value = res.data;
  } catch (err) {
    error("Gagal mengambil data request");
  } finally {
    loading.value = false;
  }
};

const approveRequest = async (id) => {
  if (!confirm("Setujui permintaan ini? User akan dibuatkan akun otomatis."))
    return;

  processingId.value = id;
  try {
    const res = await api.post(`/demo-requests/${id}/approve`);
    success(
      `Disetujui! Username: ${res.data.username}, Password: ${res.data.password} (Cek Console Server untuk Email)`
    );
    fetchRequests();
  } catch (err) {
    error(err.response?.data?.error || "Gagal menyetujui request");
  } finally {
    processingId.value = null;
  }
};

const pendingRequests = computed(() =>
  requests.value.filter((r) => r.status === "PENDING")
);
const processedRequests = computed(() =>
  requests.value.filter((r) => r.status !== "PENDING")
);

onMounted(fetchRequests);
</script>

<template>
  <DashboardLayout>
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">Permintaan Demo</h1>
        <button
          @click="fetchRequests"
          class="text-blue-600 hover:text-blue-800"
        >
          Refresh Data
        </button>
      </div>

      <!-- Pending Table -->
      <div
        class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div class="p-4 border-b border-gray-100 bg-yellow-50">
          <h2 class="font-bold text-yellow-800">
            Menunggu Persetujuan ({{ pendingRequests.length }})
          </h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th class="px-6 py-3 text-left">Tanggal</th>
                <th class="px-6 py-3 text-left">Email</th>
                <th class="px-6 py-3 text-left">Status</th>
                <th class="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="loading && requests.length === 0">
                <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                  Memuat data...
                </td>
              </tr>
              <tr v-else-if="pendingRequests.length === 0">
                <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                  Tidak ada permintaan baru
                </td>
              </tr>
              <tr
                v-for="req in pendingRequests"
                :key="req.id"
                class="hover:bg-gray-50"
              >
                <td class="px-6 py-4 text-sm whitespace-nowrap">
                  {{ moment(req.createdAt).format("DD MMM YYYY HH:mm") }}
                </td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                  {{ req.email }}
                </td>
                <td class="px-6 py-4 text-sm">
                  <span
                    class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800"
                  >
                    {{ req.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-right">
                  <button
                    @click="approveRequest(req.id)"
                    :disabled="processingId === req.id"
                    class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 text-xs"
                  >
                    {{
                      processingId === req.id
                        ? "Memproses..."
                        : "Terima & Buat Akun"
                    }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- History Table -->
      <div
        class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden opacity-75"
      >
        <div class="p-4 border-b border-gray-100 bg-gray-50">
          <h2 class="font-bold text-gray-600">Riwayat</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th class="px-6 py-3 text-left">Tanggal</th>
                <th class="px-6 py-3 text-left">Email</th>
                <th class="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="req in processedRequests"
                :key="req.id"
                class="hover:bg-gray-50"
              >
                <td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                  {{ moment(req.createdAt).format("DD MMM YYYY HH:mm") }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  {{ req.email }}
                </td>
                <td class="px-6 py-4 text-sm">
                  <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="
                      req.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    "
                  >
                    {{ req.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
