<script setup lang="ts">
import { ref } from 'vue';
import type { SubTaskInfo } from '@todolist/shared';

defineProps<{ subTasks: SubTaskInfo[] }>();
const emit = defineEmits<{
  toggle: [id: string];
  delete: [id: string];
  add: [text: string];
  reorder: [id: string, direction: 'up' | 'down'];
}>();

const newText = ref('');

function handleAdd() {
  if (!newText.value.trim()) return;
  emit('add', newText.value.trim());
  newText.value = '';
}
</script>

<template>
  <div class="st-list">
    <van-swipe-cell v-for="(st, idx) in subTasks" :key="st.id">
      <div class="st-item" @click="$emit('toggle', st.id)">
        <van-checkbox :model-value="st.isCompleted" icon-size="18" />
        <span class="st-text" :class="{ done: st.isCompleted }">{{ st.text }}</span>
        <div class="st-arrows">
          <span v-if="idx > 0" class="arr-btn" @click.stop="$emit('reorder', st.id, 'up')">↑</span>
          <span v-if="idx < subTasks.length - 1" class="arr-btn" @click.stop="$emit('reorder', st.id, 'down')">↓</span>
        </div>
      </div>
      <template #right>
        <van-button square type="danger" text="删除" @click="$emit('delete', st.id)" />
      </template>
    </van-swipe-cell>

    <div class="st-add">
      <van-field v-model="newText" placeholder="添加步骤..." @keyup.enter="handleAdd" />
      <van-button size="small" type="primary" :disabled="!newText.trim()" @click="handleAdd">添加</van-button>
    </div>
  </div>
</template>

<style scoped>
.st-list { background: var(--color-bg-card); }
.st-item {
  display: flex; align-items: center; padding: 10px 16px;
  gap: 10px; border-bottom: 1px solid var(--color-border);
}
.st-text { flex: 1; font-size: var(--font-size-sm); }
.st-text.done { text-decoration: line-through; color: var(--color-text-hint); }
.st-arrows { display: flex; gap: 4px; }
.arr-btn { font-size: 12px; color: var(--color-text-hint); cursor: pointer; padding: 2px 4px; }
.st-add { display: flex; align-items: center; padding: 8px 16px; gap: 8px; }
.st-add :deep(.van-field) { flex: 1; }
</style>
