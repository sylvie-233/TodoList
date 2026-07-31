<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import dayjs from 'dayjs';
import { showConfirmDialog, showToast } from 'vant';
import { Calendar } from 'v-calendar';
import 'v-calendar/style.css';
import type { Task } from '@todolist/shared';
import { taskApi } from '@/api/index.js';
import NavBar from '@/components/NavBar.vue';
import TaskCard from '@/components/TaskCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingSkeleton from '@/components/LoadingSkeleton.vue';

const today = dayjs().format('YYYY-MM-DD');
const selectedDate = ref(new Date());
const dayTasks = ref<Task[]>([]);
const loading = ref(false);

// 有任务的日期 → 圆点（一次加载，用于标记）
const taskDots = ref<Map<string, number>>(new Map());
const taskAttributes = computed(() =>
  Array.from(taskDots.value.entries()).map(([dateStr]) => ({
    key: dateStr,
    dates: [new Date(dateStr)],
    dot: { color: '#6366f1' },
  })),
);

const selectedAttr = computed(() => ({
  key: 'selected',
  highlight: { color: '#6366f1', fillMode: 'light' as const },
  dates: [selectedDate.value],
}));

const attributes = computed(() => [...taskAttributes.value, selectedAttr.value]);

// 加载日历圆点标记
async function loadDots() {
  try {
    const res = await taskApi.list({ pageSize: 500 } as never);
    const map = new Map<string, number>();
    res.data.forEach((t) => {
      if (t.dueDate) map.set(t.dueDate, (map.get(t.dueDate) || 0) + 1);
    });
    taskDots.value = map;
  } catch { /* ignore */ }
}

// 选中日期后从后端拉取当天任务
async function loadDayTasks() {
  const dateStr = dayjs(selectedDate.value).format('YYYY-MM-DD');
  loading.value = true;
  try {
    const res = await taskApi.list({
      dateFrom: dateStr,
      dateTo: dateStr,
      pageSize: 100,
    } as never);
    dayTasks.value = res.data;
  } catch { dayTasks.value = []; }
  loading.value = false;
}

onMounted(() => {
  loadDots();
  loadDayTasks();
});

function onDayClick(day: { id: string; date: Date }) {
  selectedDate.value = day.date;
  loadDayTasks();
}

async function handleToggle(id: string) {
  const task = dayTasks.value.find((t) => t.id === id);
  if (!task) return;
  task.isCompleted = !task.isCompleted;
  showToast('状态已更新');
  try { await taskApi.toggle(id); } catch { task.isCompleted = !task.isCompleted; }
}

async function handleDelete(id: string) {
  try {
    await showConfirmDialog({
      title: '删除任务',
      message: '确定要移到回收站吗？',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    });
    await taskApi.softDelete(id);
    dayTasks.value = dayTasks.value.filter((t) => t.id !== id);
    showToast('已移入回收站');
  } catch { /* 用户取消 */ }
}
</script>

<template>
  <div class="page">
    <NavBar title="日历" />
    <div class="calendar-wrapper">
      <Calendar :attributes="attributes" borderless title-position="left" @dayclick="onDayClick" />
    </div>
    <div class="divider" />
    <div class="day-tasks">
      <LoadingSkeleton v-if="loading" />
      <template v-else-if="dayTasks.length">
        <div class="section-hd">
          <span class="hd-date">{{ dayjs(selectedDate).format('YYYY-MM-DD') === today ? '今天' : dayjs(selectedDate).format('M月D日') }}</span>
          <span class="hd-count">{{ dayTasks.length }} 个任务</span>
        </div>
        <TaskCard v-for="task in dayTasks" :key="task.id" :task="task" @toggle="handleToggle" @delete="handleDelete" />
      </template>
      <EmptyState v-else title="这一天没有任务" description="去任务页创建带截止日期的任务" />
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 50px; }
.divider { height: 8px; background: var(--color-bg); }
.section-hd { display: flex; align-items: baseline; gap: 8px; padding: 14px 16px 8px; }
.hd-date { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-text); }
.hd-count { font-size: var(--font-size-xs); color: var(--color-text-hint); }
</style>

<style>
.calendar-wrapper { background: var(--color-bg-card); padding: 12px 4px 8px; margin: 0; }
.calendar-wrapper .vc-container,
.calendar-wrapper .vc-pane,
.calendar-wrapper .vc-weeks { width: 100% !important; max-width: none !important; }
.calendar-wrapper .vc-header { padding: 0 8px 8px !important; }
.calendar-wrapper .vc-title { font-size: 17px !important; font-weight: 700 !important; color: var(--color-text) !important; }
.calendar-wrapper .vc-weekday { font-size: 12px !important; color: var(--color-text-hint) !important; padding: 6px 0 !important; }
.calendar-wrapper .vc-day { min-height: 40px !important; }
.calendar-wrapper .vc-day-content { font-size: 15px !important; border-radius: 50% !important; }
.calendar-wrapper .is-today .vc-day-content { font-weight: 700 !important; color: var(--color-primary) !important; }
.calendar-wrapper .vc-highlight { border-radius: 50% !important; }
.calendar-wrapper .is-not-in-month .vc-day-content { opacity: 0.3 !important; }
.calendar-wrapper .vc-dots { margin-top: 2px !important; }
.calendar-wrapper .vc-dot { width: 5px !important; height: 5px !important; }
</style>
