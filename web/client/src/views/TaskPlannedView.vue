<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import dayjs from 'dayjs';
import { showConfirmDialog, showToast } from 'vant';
import { useTaskStore } from '@/stores/task.js';
import { taskApi } from '@/api/index.js';
import NavBar from '@/components/NavBar.vue';
import TaskCard from '@/components/TaskCard.vue';
import EmptyState from '@/components/EmptyState.vue';

const taskStore = useTaskStore();
const refreshing = ref(false);

const grouped = computed(() => {
  const now = dayjs();
  const tasks = taskStore.tasks.filter((t) => t.dueDate);
  const overdue: typeof tasks = [];
  const today: typeof tasks = [];
  const tomorrow: typeof tasks = [];
  const thisWeek: typeof tasks = [];
  const later: typeof tasks = [];

  for (const t of tasks) {
    const d = dayjs(t.dueDate);
    if (d.isBefore(now, 'day')) overdue.push(t);
    else if (d.isSame(now, 'day')) today.push(t);
    else if (d.isSame(now.add(1, 'day'), 'day')) tomorrow.push(t);
    else if (d.isBefore(now.add(7, 'day'), 'day')) thisWeek.push(t);
    else later.push(t);
  }

  return [
    { label: '已逾期', tasks: overdue },
    { label: '今天', tasks: today },
    { label: '明天', tasks: tomorrow },
    { label: '本周', tasks: thisWeek },
    { label: '更晚', tasks: later },
  ].filter((g) => g.tasks.length > 0);
});

async function loadData() {
  const res = await taskApi.planned(1);
  taskStore.tasks = res.data;
  taskStore.total = res.total;
  refreshing.value = false;
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

loadData();
</script>

<template>
  <div class="page">
    <NavBar title="计划任务" show-back />
    <div class="content">
      <van-pull-refresh v-model="refreshing" @refresh="loadData">
        <div v-for="group in grouped" :key="group.label" class="section">
          <h3 class="section-title">{{ group.label }} ({{ group.tasks.length }})</h3>
          <TaskCard v-for="task in group.tasks" :key="task.id" :task="task" @toggle="handleToggle" @delete="handleDelete" />
        </div>
      </van-pull-refresh>
      <EmptyState v-if="!refreshing && taskStore.tasks.length === 0" title="暂无计划任务" description="设置了截止日期的任务会出现在这里" />
    </div>
    
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 50px; }
.content { min-height: 60vh; }
.section { margin-bottom: 16px; }
.section-title { padding: 8px 16px; font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600; }
</style>
