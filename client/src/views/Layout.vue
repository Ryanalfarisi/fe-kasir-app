<script setup>
</script>

<template>
  <div class="min-h-screen bg-bg-page font-sans text-text-main">
    <header class="bg-bg-card border-b border-border sticky top-0 z-10">
      <div class="container flex items-center justify-between py-4">
        <h1 class="text-xl font-bold text-text-main">Kasir<strong class="text-primary">App</strong></h1>
        <nav class="flex gap-6">
          <router-link to="/categories" class="text-text-muted font-medium hover:text-primary transition-colors" active-class="text-primary">Kategori</router-link>
          <router-link to="/items" class="text-text-muted font-medium hover:text-primary transition-colors" active-class="text-primary">Barang</router-link>
        </nav>
      </div>
    </header>
    <main class="container py-8">
      <router-view></router-view>
    </main>
  </div>
</template>
