<template>
  <van-swipe-cell :disabled="task.isCompleted">
    <div class="task-card" :class="{ completed: task.isCompleted }" @click="goDetail">
      <van-checkbox
        :model-value="task.isCompleted"
        @click.stop
        @change="handleToggle"
      />
      <div class="task-body">
        <div class="task-title-row">
          <span v-if="task.isPinned" class="pin-icon">📌</span>
          <span class="task-title">{{ task.title }}</span>
        </div>
        <div class="task-meta" v-if="task.dueDate || task.priority !== 'none'">
          <span v-if="task.dueDate" class="due-badge" :class="{ overdue: isOverdue(task.dueDate) }">
            📅 {{ getRelativeDateLabel(task.dueDate) }}
          </span>
          <PriorityBadge :priority="task.priority" />
        </div>
        <div class="task-footer" v-if="task.tags?.length">
          <TagChip v-for="tag in task.tags" :key="tag.id" :name="tag.name" :color="tag.color" small />
        </div>
      </div>
      <div class="task-right">
        <span v-if="task.list" class="list-dot" :style="{ background: task.list.color }" />
        <span class="sub-count" v-if="task.subTasks?.length">
          {{ task.subTasks.filter(s => s.isCompleted).length }}/{{ task.subTasks.length }}
        </span>
      </div>
    </div>
    <template #right>
      <van-button square type="danger" text="删除" @click="emit('delete', props.task.id)" />
      <van-button square type="primary" :text="task.isCompleted ? '撤销' : '完成'" @click="handleToggle" />
    </template>
  </van-swipe-cell>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { Task } from '@todolist/shared';
import { getRelativeDateLabel, isOverdue } from '@/utils/date.js';
import PriorityBadge from './PriorityBadge.vue';
import TagChip from './TagChip.vue';

const props = defineProps<{ task: Task }>();
const emit = defineEmits<{ toggle: [id: string]; delete: [id: string] }>();
const router = useRouter();

function goDetail() {
  router.push(`/tasks/${props.task.id}`);
}
function handleToggle() {
  emit('toggle', props.task.id);
}
</script>

<style scoped>
.task-card {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  gap: 10px;
}
.task-card.completed .task-title {
  text-decoration: line-through;
  color: var(--color-text-hint);
}
.task-body { flex: 1; min-width: 0; }
.task-title { font-size: var(--font-size-md); word-break: break-word; }
.task-meta { display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap; }
.due-badge { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
.due-badge.overdue { color: var(--color-danger); }
.task-footer { margin-top: 4px; }
.task-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 24px;
}
.list-dot { width: 10px; height: 10px; border-radius: 50%; }
.sub-count { font-size: var(--font-size-xs); color: var(--color-text-hint); }
.pin-icon { font-size: 12px; margin-right: 2px; }
.task-title-row { display: flex; align-items: center; }
</style>
