<template>
  <div class="page">
    <NavBar title="今日任务" />
    <div class="header-date">{{ todayLabel }}</div>
    <div class="content">
      <van-pull-refresh v-model="refreshing" @refresh="loadData">
        <div v-if="overdueTasks.length" class="section">
          <h3 class="section-title">已逾期 ({{ overdueTasks.length }})</h3>
          <TaskCard v-for="task in overdueTasks" :key="task.id" :task="task" @toggle="handleToggle" @delete="handleDelete" />
        </div>
        <div class="section">
          <h3 class="section-title">今天 ({{ todayTasks.length }})</h3>
          <TaskCard v-for="task in todayTasks" :key="task.id" :task="task" @toggle="handleToggle" @delete="handleDelete" />
        </div>
      </van-pull-refresh>
      <EmptyState
        v-if="!refreshing && taskStore.tasks.length === 0"
        title="今天没有任务"
        description="享受你的一天！"
      />
    </div>
    <div class="fab-wrapper">
      <van-button type="primary" round icon="plus" size="large" @click="showCreate = true" />
    </div>
    <van-popup v-model:show="showCreate" position="bottom" round :style="{ height: '80%' }">
      <div class="popup-header">
        <span>新建任务</span>
        <van-icon name="cross" size="20" @click="showCreate = false" />
      </div>
      <TaskForm :loading="creating" @submit="handleCreate" />
    </van-popup>
    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import { useTaskStore } from '@/stores/task.js';
import { taskApi } from '@/api/index.js';
import NavBar from '@/components/NavBar.vue';
import TabBar from '@/components/TabBar.vue';
import TaskCard from '@/components/TaskCard.vue';
import TaskForm from '@/components/TaskForm.vue';
import EmptyState from '@/components/EmptyState.vue';
import type { CreateTaskDto, UpdateTaskDto } from '@todolist/shared';

const taskStore = useTaskStore();
const refreshing = ref(false);
const showCreate = ref(false);
const creating = ref(false);

const todayLabel = computed(() => dayjs().format('YYYY年M月D日 dddd'));

const overdueTasks = computed(() =>
  taskStore.tasks.filter(
    (t) => !t.isCompleted && t.dueDate && dayjs(t.dueDate).isBefore(dayjs(), 'day'),
  ),
);

const todayTasks = computed(() =>
  taskStore.tasks.filter(
    (t) => !t.isCompleted && (!t.dueDate || dayjs(t.dueDate).isSame(dayjs(), 'day')),
  ),
);

async function loadData() {
  const tasks = await taskApi.today();
  taskStore.tasks = Array.isArray(tasks) ? tasks : [];
  taskStore.total = taskStore.tasks.length;
  refreshing.value = false;
}

function handleToggle(id: string) { taskStore.toggleTask(id); }
function handleDelete(id: string) { taskStore.deleteTask(id); }

async function handleCreate(dto: CreateTaskDto | UpdateTaskDto) {
  creating.value = true;
  try {
    await taskStore.createTask({ ...(dto as CreateTaskDto), dueDate: dayjs().format('YYYY-MM-DD') });
    showCreate.value = false;
  } finally { creating.value = false; }
}

loadData();
</script>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 50px; }
.header-date { text-align: center; padding: 12px; font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.content { min-height: 60vh; }
.section { margin-bottom: 16px; }
.section-title { padding: 8px 16px; font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600; }
.fab-wrapper { position: fixed; bottom: 70px; right: 20px; z-index: 100; }
.popup-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; font-size: var(--font-size-lg); font-weight: 600; }
</style>
