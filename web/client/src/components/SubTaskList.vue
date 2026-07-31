<script setup lang="ts">
import { ref } from 'vue';
import type { SubTaskInfo } from '@todolist/shared';

defineProps<{ subTasks: SubTaskInfo[] }>();
const emit = defineEmits<{
  toggle: [id: string];
  delete: [id: string];
  add: [text: string];
}>();

const newText = ref('');

function handleAdd() {
  if (!newText.value.trim()) return;
  emit('add', newText.value.trim());
  newText.value = '';
}
</script>

<template>
  <div class="subtask-list">
    <div v-for="st in subTasks" :key="st.id" class="subtask-item">
      <van-checkbox :model-value="st.isCompleted" @change="$emit('toggle', st.id)" />
      <span class="subtask-text" :class="{ done: st.isCompleted }">{{ st.text }}</span>
      <van-icon name="delete-o" size="16" color="#ccc" @click="$emit('delete', st.id)" />
    </div>
    <div class="subtask-add">
      <van-field
        v-model="newText"
        placeholder="添加步骤..."
        @keyup.enter="handleAdd"
      />
      <van-button size="small" type="primary" :disabled="!newText.trim()" @click="handleAdd">添加</van-button>
    </div>
  </div>
</template>

<style scoped>
.subtask-list { background: var(--color-bg-card); }
.subtask-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  gap: 10px;
  border-bottom: 1px solid var(--color-border);
}
.subtask-text { flex: 1; font-size: var(--font-size-sm); }
.subtask-text.done { text-decoration: line-through; color: var(--color-text-hint); }
.subtask-add {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 8px;
}
.subtask-add :deep(.van-field) { flex: 1; }
</style>
