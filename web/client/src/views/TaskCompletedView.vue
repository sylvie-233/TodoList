<script setup lang="ts">
import { ref } from 'vue';
import { showConfirmDialog, showToast } from 'vant';
import { useTaskStore } from '@/stores/task.js';
import { taskApi } from '@/api/index.js';
import NavBar from '@/components/NavBar.vue';
import TaskCard from '@/components/TaskCard.vue';
import EmptyState from '@/components/EmptyState.vue';

const taskStore = useTaskStore();
const loading = ref(false);
const finished = ref(false);
let page = 1;

const pageSize = 20;

async function onLoad() {
  loading.value = true;
  try {
    const res = await taskApi.completed(page);
    taskStore.tasks.push(...res.data);
    taskStore.total = res.total;
    if (taskStore.tasks.length >= res.total) finished.value = true;
    page++;
  } finally {
    loading.value = false;
  }
}

function handleToggle(id: string) { taskStore.toggleTask(id); showToast('状态已更新'); }
async function handleDelete(id: string) {
  try {
    await showConfirmDialog({
      title: '删除任务',
      message: '确定要移到回收站吗？',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    });
    taskStore.deleteTask(id);
    showToast('已移入回收站');
  } catch { /* 用户取消 */ }
}

page = 1;
taskStore.tasks = [];
onLoad();
</script>

<template>
  <div class="page">
    <NavBar title="已完成" show-back />
    <div class="content">
      <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
        <TaskCard v-for="task in taskStore.tasks" :key="task.id" :task="task" @toggle="handleToggle" @delete="handleDelete" />
      </van-list>
      <EmptyState v-if="!loading && taskStore.tasks.length === 0" title="暂无已完成任务" />
    </div>
    
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 50px; }
.content { min-height: 60vh; }
</style>
