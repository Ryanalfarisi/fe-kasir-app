<script setup>
import { useToast } from '../composables/useToast'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-vue-next'

const { toasts, removeToast } = useToast()

const getIcon = (type) => {
  switch (type) {
    case 'success': return CheckCircle
    case 'error': return XCircle
    case 'warning': return AlertCircle
    default: return Info
  }
}

const getClasses = (type) => {
  switch (type) {
    case 'success': return 'bg-green-50 text-green-800 border-green-200'
    case 'error': return 'bg-red-50 text-red-800 border-red-200'
    case 'warning': return 'bg-yellow-50 text-yellow-800 border-yellow-200'
    default: return 'bg-blue-50 text-blue-800 border-blue-200'
  }
}
</script>

<template>
  <div class="fixed top-4 right-4 z-[10000] flex flex-col gap-3 pointer-events-none">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[300px] max-w-sm transition-all"
        :class="getClasses(toast.type)"
      >
        <component :is="getIcon(toast.type)" class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div class="flex-1 text-sm font-medium">{{ toast.message }}</div>
        <button @click="removeToast(toast.id)" class="opacity-50 hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
