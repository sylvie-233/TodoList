<script setup lang="ts">
import { ref } from 'vue';
import { showConfirmDialog, showToast } from 'vant';
import { useTaskStore } from '@/stores/task.js';
import { taskApi } from '@/api/index.js';
import { formatDateTime } from '@/utils/date.js';
import NavBar from '@/components/NavBar.vue';
import EmptyState from '@/components/EmptyState.vue';

const taskStore = useTaskStore();
const loading = ref(false);
const finished = ref(false);
let page = 1;

taskStore.tasks = [];

async function onLoad() {
  loading.value = true;
  try {
    const res = await taskApi.recycleBin(page);
    taskStore.tasks.push(...res.data);
    taskStore.total = res.total;
    if (taskStore.tasks.length >= res.total) finished.value = true;
    page++;
  } finally {
    loading.value = false;
  }
}

async function handleRestore(id: string) {
  await taskStore.restoreTask(id);
  await new Promise((r) => setTimeout(r, 250));
  showToast('任务已恢复');
}

async function handlePermanent(id: string) {
  await showConfirmDialog({
    title: '永久删除',
    message: '删除后无法恢复，确定继续？',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  });
  await taskStore.permanentDeleteTask(id);
  await new Promise((r) => setTimeout(r, 250));
  showToast('任务已永久删除');
}

async function handleEmptyAll() {
  await showConfirmDialog({
    title: '清空回收站',
    message: '将永久删除所有任务，确定继续？',
    confirmButtonText: '全部删除',
    cancelButtonText: '取消',
  });
  const ids = taskStore.tasks.map((t) => t.id);
  await taskStore.batchAction({ action: 'delete', taskIds: ids });
  taskStore.tasks = [];
  taskStore.total = 0;
  finished.value = true;
}
</script>

<template>
  <div class="page">
    <NavBar title="回收站" show-back>
      <template #right>
        <van-button size="small" type="danger" plain @click="handleEmptyAll">清空</van-button>
      </template>
    </NavBar>
    <div class="content">
      <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
        <van-swipe-cell v-for="task in taskStore.tasks" :key="task.id">
          <div class="bin-card">
            <span class="bin-title">{{ task.title }}</span>
            <span class="bin-date">已删除于 {{ formatDateTime(task.deletedAt) }}</span>
          </div>
          <template #right>
            <van-button square type="success" text="恢复" @click="handleRestore(task.id)" />
            <van-button square type="danger" text="删除" @click="handlePermanent(task.id)" />
          </template>
        </van-swipe-cell>
      </van-list>
      <EmptyState v-if="!loading && taskStore.tasks.length === 0" title="回收站是空的" />
    </div>
    
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 50px; }
.content { min-height: 60vh; }
.bin-card {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
}
.bin-title { font-size: var(--font-size-md); }
.bin-date { font-size: var(--font-size-xs); color: var(--color-text-hint); }
</style>
