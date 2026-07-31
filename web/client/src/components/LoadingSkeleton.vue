<script setup lang="ts">
withDefaults(defineProps<{ count?: number; rows?: number }>(), {
  count: 5,
  rows: 2,
});
</script>

<template>
  <div class="skeleton-list">
    <div v-for="i in count" :key="i" class="skeleton-card">
      <van-skeleton title :row="rows" :loading="true" />
    </div>
  </div>
</template>

<style scoped>
.skeleton-list {
  background: var(--color-bg-card);
}
.skeleton-card {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}
</style>
