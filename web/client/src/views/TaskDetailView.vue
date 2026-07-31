<template>
  <div class="page">
    <NavBar title="任务详情">
      <template #right>
        <van-icon name="ellipsis" size="20" @click="showActions = true" />
      </template>
    </NavBar>
    <div class="content" v-if="taskStore.currentTask">
      <div class="detail-card">
        <h2 class="detail-title">{{ taskStore.currentTask.title }}</h2>
        <p v-if="taskStore.currentTask.description" class="detail-desc">{{ taskStore.currentTask.description }}</p>
        <div class="detail-meta">
          <div v-if="taskStore.currentTask.priority !== 'none'" class="meta-item">
            <PriorityBadge :priority="taskStore.currentTask.priority" />
          </div>
          <div v-if="taskStore.currentTask.dueDate" class="meta-item">
            📅 {{ taskStore.currentTask.dueDate }}
            <span v-if="taskStore.currentTask.dueTime">{{ taskStore.currentTask.dueTime }}</span>
          </div>
          <div v-if="taskStore.currentTask.list" class="meta-item">
            📋 {{ taskStore.currentTask.list.name }}
          </div>
        </div>
        <div v-if="taskStore.currentTask.tags?.length" class="tag-row">
          <TagChip v-for="tag in taskStore.currentTask.tags" :key="tag.id" :name="tag.name" :color="tag.color" />
        </div>
      </div>

      <div class="subtask-section">
        <h3>子任务</h3>
        <SubTaskList
          :sub-tasks="taskStore.currentTask.subTasks ?? []"
          @toggle="handleSubToggle"
          @delete="handleSubDelete"
          @add="handleSubAdd"
        />
      </div>
    </div>

    <div class="bottom-bar">
      <van-button
        type="default"
        size="small"
        @click="handleToggle"
      >
        {{ taskStore.currentTask?.isCompleted ? '撤销' : '完成' }}
      </van-button>
      <van-button
        type="primary"
        size="small"
        @click="$router.push(`/tasks/${taskStore.currentTask?.id}/edit`)"
      >
        编辑
      </van-button>
    </div>

    <van-action-sheet
      v-model:show="showActions"
      :actions="actions"
      @select="onActionSelect"
    />
    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import { useTaskStore } from '@/stores/task.js';
import { useSubTaskStore } from '@/stores/sub-task.js';
import NavBar from '@/components/NavBar.vue';
import TabBar from '@/components/TabBar.vue';
import PriorityBadge from '@/components/PriorityBadge.vue';
import TagChip from '@/components/TagChip.vue';
import SubTaskList from '@/components/SubTaskList.vue';

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const subTaskStore = useSubTaskStore();
const showActions = ref(false);

const actions = [
  { name: '复制任务', value: 'copy' },
  { name: '删除任务', value: 'delete' },
];

onMounted(() => {
  const id = route.params.id as string;
  taskStore.fetchTaskById(id);
});

function handleToggle() {
  if (taskStore.currentTask) taskStore.toggleTask(taskStore.currentTask.id);
}

async function onActionSelect(action: { value: string }) {
  showActions.value = false;
  if (action.value === 'copy') {
    if (taskStore.currentTask) {
      await taskStore.copyTask(taskStore.currentTask.id);
      showToast('已复制');
    }
  } else if (action.value === 'delete') {
    await showConfirmDialog({
      title: '删除任务',
      message: '确定要移到回收站吗？',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    });
    if (taskStore.currentTask) {
      await taskStore.deleteTask(taskStore.currentTask.id);
      router.back();
    }
  }
}

function handleSubToggle(id: string) {
  subTaskStore.toggleSubTask(id);
  // 同步更新 currentTask
  if (taskStore.currentTask?.subTasks) {
    const st = taskStore.currentTask.subTasks.find((s) => s.id === id);
    if (st) st.isCompleted = !st.isCompleted;
    taskStore.currentTask = { ...taskStore.currentTask };
  }
}

function handleSubDelete(id: string) {
  subTaskStore.deleteSubTask(id);
  if (taskStore.currentTask?.subTasks) {
    taskStore.currentTask.subTasks = taskStore.currentTask.subTasks.filter((s) => s.id !== id);
    taskStore.currentTask = { ...taskStore.currentTask };
  }
}

async function handleSubAdd(text: string) {
  if (!taskStore.currentTask) return;
  const st = await subTaskStore.createSubTask({ taskId: taskStore.currentTask.id, text });
  const updated = { ...taskStore.currentTask };
  updated.subTasks = [...(updated.subTasks ?? []), { id: st.id, text: st.text, isCompleted: st.isCompleted, sortOrder: st.sortOrder }];
  taskStore.currentTask = updated;
}
</script>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 80px; }
.content { padding: 0; }
.detail-card { background: var(--color-bg-card); padding: 16px; margin-bottom: 12px; }
.detail-title { font-size: var(--font-size-xl); font-weight: 600; }
.detail-desc { margin-top: 8px; color: var(--color-text-secondary); white-space: pre-wrap; }
.detail-meta { display: flex; gap: 12px; margin-top: 12px; flex-wrap: wrap; }
.meta-item { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.tag-row { margin-top: 12px; }
.subtask-section { background: var(--color-bg-card); }
.subtask-section h3 { padding: 12px 16px; font-size: var(--font-size-md); font-weight: 600; }
.bottom-bar {
  position: fixed; bottom: 50px; left: 0; right: 0;
  display: flex; gap: 12px; justify-content: center; padding: 8px 16px;
  background: var(--color-bg-card); border-top: 1px solid var(--color-border);
}
</style>
