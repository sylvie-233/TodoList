<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import { useTaskStore } from '@/stores/task.js';
import { subTaskApi, taskApi } from '@/api/index.js';
import NavBar from '@/components/NavBar.vue';
import PriorityBadge from '@/components/PriorityBadge.vue';
import TagChip from '@/components/TagChip.vue';
import SubTaskList from '@/components/SubTaskList.vue';

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const showActions = ref(false);
const taskImages = ref<{ id: string; url: string }[]>([]);
const previewShow = ref(false);
const previewIndex = ref(0);

const previewUrls = computed(() => taskImages.value.map((img) => {
  if (img.url.startsWith('http')) return img.url;
  return window.location.origin + img.url;
}));

function previewImages(index = 0) {
  previewIndex.value = index;
  previewShow.value = true;
}

const actions = [
  { name: '复制任务', value: 'copy' },
  { name: '删除任务', value: 'delete' },
];

onMounted(async () => {
  const id = route.params.id as string;
  taskStore.fetchTaskById(id);
  try { taskImages.value = await taskApi.images(id); } catch { /* ignore */ }
});

// previewImages 已改用 computed + ImagePreview 组件

function handleToggle() {
  if (!taskStore.currentTask) return;
  taskStore.toggleTask(taskStore.currentTask.id);
  showToast('状态已更新');
}

async function onActionSelect(action: { value: string }) {
  showActions.value = false;
  if (action.value === 'copy') {
    if (taskStore.currentTask) {
      await taskStore.copyTask(taskStore.currentTask.id);
      showToast('任务已复制');
    }
  } else if (action.value === 'delete') {
    await showConfirmDialog({ title: '删除任务', message: '确定要移到回收站吗？', confirmButtonText: '删除', cancelButtonText: '取消' });
    if (taskStore.currentTask) {
      await taskStore.deleteTask(taskStore.currentTask.id);
      showToast('已移入回收站');
      router.back();
    }
  }
}

function syncCurrentTask() {
  if (taskStore.currentTask) taskStore.currentTask = { ...taskStore.currentTask };
}

async function handleSubToggle(id: string) {
  if (taskStore.currentTask?.subTasks) {
    const st = taskStore.currentTask.subTasks.find((s) => s.id === id);
    if (!st) return;
    st.isCompleted = !st.isCompleted; // 先改 UI
    try {
      await subTaskApi.toggle(id);
    } catch {
      st.isCompleted = !st.isCompleted; // 失败则回滚
    }
  }
}

async function handleSubDelete(id: string) {
  await showConfirmDialog({ title: '删除步骤', message: '确定删除这条子任务？', confirmButtonText: '删除', cancelButtonText: '取消' });
  await subTaskApi.remove(id);
  showToast('步骤已删除');
  if (taskStore.currentTask?.subTasks) {
    taskStore.currentTask.subTasks = taskStore.currentTask.subTasks.filter((s) => s.id !== id);
    syncCurrentTask();
  }
}

async function handleSubAdd(text: string) {
  if (!taskStore.currentTask) return;
  const st = await subTaskApi.create({ taskId: taskStore.currentTask.id, text });
  showToast('步骤已添加');
  const updated = { ...taskStore.currentTask };
  updated.subTasks = [...(updated.subTasks ?? []), { id: st.id, text: st.text, isCompleted: st.isCompleted, sortOrder: st.sortOrder }];
  taskStore.currentTask = updated;
}

async function handleSubReorder(id: string, direction: 'up' | 'down') {
  const list = taskStore.currentTask?.subTasks;
  if (!list) return;
  const idx = list.findIndex((s) => s.id === id);
  if (idx < 0) return;
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= list.length) return;

  // 交换位置
  [list[idx], list[swapIdx]] = [list[swapIdx], list[idx]];
  syncCurrentTask();

  // 持久化
  await subTaskApi.reorder(list.map((s, i) => ({ id: s.id, sortOrder: i })));
}
</script>

<template>
  <div class="page">
    <NavBar title="任务详情" show-back>
      <template #right><van-icon name="ellipsis" size="20" @click="showActions = true" /></template>
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
            📅 {{ taskStore.currentTask.dueDate }}<span v-if="taskStore.currentTask.dueTime"> {{ taskStore.currentTask.dueTime }}</span>
          </div>
          <div v-if="taskStore.currentTask.list" class="meta-item">📋 {{ taskStore.currentTask.list.name }}</div>
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
          @reorder="handleSubReorder"
        />
      </div>
      <div class="subtask-section" style="margin-top: 12px" v-if="taskImages.length">
        <h3>图片 ({{ taskImages.length }})</h3>
        <div class="img-row">
          <img v-for="(img, i) in taskImages" :key="img.id" :src="img.url" class="img-thumb" @click="previewImages(i)" alt="" />
        </div>
      </div>
    </div>

    <div class="bottom-bar">
      <van-button type="default" size="small" @click="handleToggle">
        {{ taskStore.currentTask?.isCompleted ? '撤销' : '完成' }}
      </van-button>
      <van-button type="primary" size="small" @click="$router.push(`/tasks/${taskStore.currentTask?.id}/edit`)">编辑</van-button>
    </div>

    <van-action-sheet v-model:show="showActions" :actions="actions" @select="onActionSelect" />

    <van-image-preview
      v-model:show="previewShow"
      :images="previewUrls"
      :start-position="previewIndex"
      :closeable="true"
    />
  </div>
</template>

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
.img-row { display: flex; gap: 8px; padding: 0 16px 12px; overflow-x: auto; }
.img-row::-webkit-scrollbar { display: none; }
.img-thumb { width: 72px; height: 72px; border-radius: 6px; object-fit: cover; cursor: pointer; flex-shrink: 0; }
.bottom-bar { position: fixed; bottom: 50px; left: 0; right: 0; display: flex; gap: 12px; justify-content: center; padding: 8px 16px; background: var(--color-bg-card); border-top: 1px solid var(--color-border); }
</style>
