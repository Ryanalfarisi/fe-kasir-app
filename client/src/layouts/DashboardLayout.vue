<script setup>
import Sidebar from '../components/Sidebar.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <Sidebar />
    
    <!-- Main Content Area -->
    <main class="md:ml-64 p-4 md:p-8 pt-20 md:pt-8 mb-16 md:mb-0 min-h-screen">
      <slot />
    </main>
  </div>
</template>
