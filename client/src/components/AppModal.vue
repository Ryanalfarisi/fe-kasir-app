<script setup>
defineProps({
  title: String,
  show: Boolean
});
defineEmits(['close']);
</script>

<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-bg-card rounded-xl w-full max-w-lg shadow-xl animate-[slideIn_0.2s_ease-out] overflow-hidden">
      <div class="px-6 py-4 border-b border-border flex justify-between items-center bg-gray-50/50">
        <h3 class="text-lg font-semibold">{{ title }}</h3>
        <button class="text-text-muted hover:text-text-main text-2xl leading-none" @click="$emit('close')">&times;</button>
      </div>
      <div class="p-6">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
