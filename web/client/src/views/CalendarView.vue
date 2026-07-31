<template>
  <div class="page">
    <NavBar title="日历" />
    <van-calendar
      :show-confirm="false"
      :style="{ height: '420px' }"
      @select="onDateSelect"
    />
    <div class="day-tasks">
      <h3 v-if="selectedDate">{{ selectedDate === today ? '今天' : selectedDate }} 的任务</h3>
      <TaskCard
        v-for="task in dayTasks"
        :key="task.id"
        :task="task"
        @toggle="handleToggle"
        @delete="handleDelete"
      />
      <EmptyState v-if="dayTasks.length === 0 && selectedDate" title="这一天没有任务" />
      <EmptyState v-if="!selectedDate" title="点击日期查看任务" description="选择一个日期查看当天的待办事项" />
    </div>
    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import dayjs from 'dayjs';
import { useTaskStore } from '@/stores/task.js';
import { taskApi } from '@/api/index.js';
import NavBar from '@/components/NavBar.vue';
import TabBar from '@/components/TabBar.vue';
import TaskCard from '@/components/TaskCard.vue';
import EmptyState from '@/components/EmptyState.vue';

const taskStore = useTaskStore();
const selectedDate = ref('');
const today = dayjs().format('YYYY-MM-DD');

const dayTasks = computed(() =>
  taskStore.tasks.filter((t) => t.dueDate === selectedDate.value),
);

onMounted(async () => {
  const res = await taskApi.list();
  taskStore.tasks = res.data;
});

function onDateSelect(date: Date) {
  selectedDate.value = dayjs(date).format('YYYY-MM-DD');
}

function handleToggle(id: string) { taskStore.toggleTask(id); }
function handleDelete(id: string) { taskStore.deleteTask(id); }
</script>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 50px; }
.day-tasks { padding: 0; }
.day-tasks h3 { padding: 12px 16px; font-size: var(--font-size-md); font-weight: 600; color: var(--color-text-secondary); }
</style>
