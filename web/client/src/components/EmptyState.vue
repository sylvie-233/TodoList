<script setup lang="ts">
defineProps<{
  icon?: string;
  title: string;
  description?: string;
  actionText?: string;
}>();
defineEmits<{ action: [] }>();
</script>

<template>
  <div class="empty-state">
    <van-icon :name="icon || 'notes-o'" size="64" color="#dcdcdc" />
    <p class="empty-title">{{ title }}</p>
    <p v-if="description" class="empty-desc">{{ description }}</p>
    <van-button v-if="actionText" type="primary" round size="small" @click="$emit('action')">
      {{ actionText }}
    </van-button>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
}
.empty-title {
  margin-top: 12px;
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
}
.empty-desc {
  margin-top: 8px;
  font-size: var(--font-size-sm);
  color: var(--color-text-hint);
  text-align: center;
}
</style>
