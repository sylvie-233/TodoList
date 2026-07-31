<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Task } from '@todolist/shared';
import type { SubTaskInfo } from '@todolist/shared';
import { getRelativeDateLabel, isOverdue } from '@/utils/date.js';
import { useListStore } from '@/stores/list.js';
import { subTaskApi, taskApi } from '@/api/index.js';
import PriorityBadge from './PriorityBadge.vue';
import TagChip from './TagChip.vue';

const props = defineProps<{ task: Task }>();
const emit = defineEmits<{ toggle: [id: string]; delete: [id: string] }>();
const router = useRouter();
const listStore = useListStore();

const expanded = ref(false);
const subtasks = ref<SubTaskInfo[]>([]);
const subtaskLoading = ref(false);

const listColor = computed(() => {
  if (props.task.list?.color) return props.task.list.color;
  if (!props.task.listId) return null;
  return listStore.lists.find((l) => l.id === props.task.listId)?.color ?? null;
});

function goDetail() { router.push(`/tasks/${props.task.id}`); }
function handleToggle() { emit('toggle', props.task.id); }

async function toggleExpand() {
  expanded.value = !expanded.value;
  if (expanded.value && subtasks.value.length === 0) {
    subtaskLoading.value = true;
    try {
      subtasks.value = await taskApi.subTasks(props.task.id);
    } catch { /* ignore */ }
    subtaskLoading.value = false;
  }
}

async function toggleSubTask(st: SubTaskInfo) {
  await subTaskApi.toggle(st.id);
  st.isCompleted = !st.isCompleted;
  subtasks.value = [...subtasks.value];
  // 同步更新主任务上的计数
  if (props.task.subTaskCount) {
    props.task.subTaskCount.completed += st.isCompleted ? 1 : -1;
  }
}
</script>

<template>
  <div>
    <van-swipe-cell :disabled="task.isCompleted">
      <div class="task-card" :class="{ completed: task.isCompleted }" @click="goDetail">
        <van-checkbox :model-value="task.isCompleted" icon-size="20" @click.stop="handleToggle" />
        <div class="task-body">
          <div class="task-title-row">
            <span v-if="task.isPinned" class="pin-icon">📌</span>
            <span class="task-title">{{ task.title }}</span>
          </div>
          <div class="task-meta">
            <div class="meta-left" v-if="task.dueDate || task.priority !== 'none' || task.list?.name">
              <span v-if="task.dueDate" class="due-badge" :class="{ overdue: isOverdue(task.dueDate) }">
                📅 {{ getRelativeDateLabel(task.dueDate) }}
              </span>
              <PriorityBadge :priority="task.priority" />
              <span v-if="task.list?.name" class="list-label">
                <span class="list-dot" :style="{ background: listColor || '#ccc' }" />{{ task.list.name }}
              </span>
            </div>
            <span v-if="task.subTaskCount?.total" class="sub-link" @click.stop="toggleExpand">
              {{ task.subTaskCount.completed }}/{{ task.subTaskCount.total }}
            </span>
          </div>
          <div class="task-footer" v-if="task.tags?.length">
            <TagChip v-for="tag in task.tags" :key="tag.id" :name="tag.name" :color="tag.color" small />
          </div>
        </div>
      </div>
      <template #right>
        <van-button square type="danger" text="删除" @click="emit('delete', props.task.id)" />
        <van-button square type="primary" :text="task.isCompleted ? '撤销' : '完成'" @click="handleToggle" />
      </template>
    </van-swipe-cell>

    <div v-if="expanded" class="subtask-panel">
      <div v-if="subtaskLoading" class="st-loading">加载中...</div>
      <div v-else v-for="st in subtasks" :key="st.id" class="st-row" @click.stop="toggleSubTask(st)">
        <van-checkbox :model-value="st.isCompleted" icon-size="16" />
        <span :class="{ done: st.isCompleted }">{{ st.text }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-card { display: flex; align-items: flex-start; padding: 12px 16px; background: var(--color-bg-card); border-bottom: 1px solid var(--color-border); gap: 10px; }
.task-card.completed .task-title { text-decoration: line-through; color: var(--color-text-hint); }
.task-body { flex: 1; min-width: 0; }
.task-title { font-size: var(--font-size-md); word-break: break-word; }
.task-meta { display: flex; gap: 6px; margin-top: 4px; justify-content: space-between; align-items: center; }
.meta-left { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.due-badge { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
.due-badge.overdue { color: var(--color-danger); }
.task-footer { margin-top: 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.list-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.list-label { display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--color-text-hint); }
.pin-icon { font-size: 12px; margin-right: 2px; }
.task-title-row { display: flex; align-items: center; }

.sub-link { font-size: 11px; color: var(--color-primary); cursor: pointer; }
.subtask-panel { background: var(--color-bg); border-bottom: 1px solid var(--color-border); padding: 0 16px 8px 48px; }
.st-loading { padding: 6px 0; font-size: 12px; color: var(--color-text-hint); }
.st-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; font-size: var(--font-size-sm); cursor: pointer; }
.st-row .done { text-decoration: line-through; color: var(--color-text-hint); }
</style>
