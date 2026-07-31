<script setup lang="ts">
import { Priority } from '@todolist/shared';

defineProps<{ priority: string }>();

const colorMap: Record<string, string> = {
  [Priority.URGENT]: '#ef4444',
  [Priority.HIGH]: '#f97316',
  [Priority.MEDIUM]: '#eab308',
  [Priority.LOW]: '#3b82f6',
  [Priority.NONE]: '#9ca3af',
};

const labelMap: Record<string, string> = {
  [Priority.URGENT]: '紧急',
  [Priority.HIGH]: '高',
  [Priority.MEDIUM]: '中',
  [Priority.LOW]: '低',
  [Priority.NONE]: '',
};
</script>

<template>
  <span v-if="priority !== 'none'" class="priority-badge" :style="{ color: colorMap[priority], borderColor: colorMap[priority] }">
    {{ labelMap[priority] }}
  </span>
</template>

<style scoped>
.priority-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
  border: 1px solid;
  line-height: 1.4;
}
</style>
