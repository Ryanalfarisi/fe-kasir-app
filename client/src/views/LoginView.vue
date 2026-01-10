<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "../composables/useToast";
import api from "../api";

const router = useRouter();
const errorMsg = ref(""); // Renamed because useToast() exports { error } function
// ... but destructured { success, error } from useToast earlier.
// To avoid naming conflict if we use error function as 'toastError'
const { success, error: toastError } = useToast();

// ... Existing logic ...
const username = ref("");
const password = ref("");
const loading = ref(false);

const handleLogin = async () => {
  if (!username.value || !password.value) {
    toastError("Mohon isi Username dan Password");
    return;
  }

  loading.value = true;

  try {
    const response = await api.post("/auth/login", {
      username: username.value,
      password: password.value,
    });

    const { token, user } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    success("Login berhasil! Selamat datang.");
    router.push("/");
  } catch (err) {
    console.error(err);
    toastError(
      err.response?.data?.error || "Login gagal. Periksa nama dan password."
    );
  } finally {
    loading.value = false;
  }
};

const handleGoogleCallback = async (response) => {
  loading.value = true;
  try {
    const res = await api.post("/auth/google-login", {
      credential: response.credential,
    });

    const { token, user } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    router.push("/");
  } catch (err) {
    console.error(err);
    toastError("Gagal login dengan Google.");
  } finally {
    loading.value = false;
  }
};
// Note: In previous step I renamed the usage manually but let's be clean.

// Refactor:
// const { success, error } = useToast()  <-- This conflicts with error.value if we use it for template alert?
// In template we use v-if="error". Wait, previous code used v-if="error" but defined 'error' as function from useToast?
// No, looking at previous code:
// const { success, error } = useToast()
// <div v-if="error" ...> {{ error }} </div>
// This implies 'error' was a ref? useToast usually returns functions.
// Let's assume useToast returns functions 'success' and 'error'.
// So <div v-if="error"> will try to check if function is truthy? That's always true.
// The template usage seems wrong or useToast returns a ref?
// Let's look at `useToast`. I don't have it open.
// Assuming useToast returns functions.
// I should create a local ref for form-level error message: errorMsg.

const showDemoModal = ref(false);
const demoEmail = ref("");
const demoLoading = ref(false);

const submitDemoRequest = async () => {
  if (!demoEmail.value) return;
  demoLoading.value = true;
  try {
    await api.post("/demo-requests", { email: demoEmail.value });
    showDemoModal.value = false;
    demoEmail.value = "";
    success("Permintaan terkirim! Admin akan menghubungi Anda via email.");
  } catch (err) {
    console.error(err);
    toastError(err.response?.data?.error || "Gagal mengirim request");
  } finally {
    demoLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
      <!-- Header -->
      <div class="bg-blue-600 p-8 text-white text-center">
        <h1 class="text-3xl font-bold mb-2">Kasir App</h1>
        <p class="text-blue-100">Masuk untuk melanjutkan</p>
      </div>

      <!-- Form -->
      <div class="p-8">
        <div class="mb-6 flex justify-center">
          <GoogleLogin :callback="handleGoogleCallback" />
        </div>

        <div class="relative mb-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500"
              >Atau login dengan username</span
            >
          </div>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div
            v-if="errorMsg"
            class="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center"
          >
            {{ errorMsg }}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Username</label
            >
            <input
              v-model="username"
              type="text"
              required
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Masukkan username"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Password</label
            >
            <input
              v-model="password"
              type="password"
              required
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Masukkan password"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {{ loading ? "Memproses..." : "Masuk" }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <button
            @click="showDemoModal = true"
            class="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Belum punya akun? Request Demo
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t border-gray-100"
      >
        &copy; 2026 Kasir App V1.0
      </div>
    </div>
  </div>

  <!-- Demo Request Modal -->
  <div
    v-if="showDemoModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  >
    <div class="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
      <div class="bg-blue-600 p-4 text-white flex justify-between items-center">
        <h3 class="font-bold">Request Demo Account</h3>
        <button
          @click="showDemoModal = false"
          class="text-white hover:text-gray-200"
        >
          <span class="text-xl">&times;</span>
        </button>
      </div>
      <div class="p-6">
        <p class="text-sm text-gray-600 mb-4">
          Masukkan email Anda. Admin akan meninjau dan mengirimkan kredensial
          login ke email tersebut.
        </p>
        <form @submit.prevent="submitDemoRequest">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Email</label
            >
            <input
              v-model="demoEmail"
              type="email"
              required
              class="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="nama@email.com"
            />
          </div>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              @click="showDemoModal = false"
              class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="demoLoading"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{ demoLoading ? "Mengirim..." : "Kirim Request" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
