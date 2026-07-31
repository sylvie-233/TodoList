<script setup lang="ts">
import { ref, computed } from 'vue';
import { showToast } from 'vant';
import { useTaskStore } from '@/stores/task.js';
import { taskApi } from '@/api/index.js';
import NavBar from '@/components/NavBar.vue';
import TaskCard from '@/components/TaskCard.vue';
import TaskForm from '@/components/TaskForm.vue';
import TaskFilter from '@/components/TaskFilter.vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingSkeleton from '@/components/LoadingSkeleton.vue';
import type { CreateTaskDto, UpdateTaskDto } from '@todolist/shared';

const taskStore = useTaskStore();
const activeTab = ref('all');
const tabTransition = ref('slide-left');

const tabOrder: Record<string, number> = {
  all: 0, today: 1, planned: 2, completed: 3,
};
const refreshing = ref(false);
const listLoading = ref(false);
const finished = ref(false);
const showCreate = ref(false);
const creating = ref(false);
const showFilter = ref(false);
const isInitialLoading = ref(true);
const customFilter = ref<Record<string, unknown>>({});

const hasActiveFilter = computed(() => Object.keys(customFilter.value).length > 0);

function getFilter(): Record<string, unknown> {
  const base = { ...customFilter.value };
  switch (activeTab.value) {
    case 'completed': base.status = 'completed'; break;
    default: if (!base.status) base.status = 'active'; break;
  }
  return base;
}

async function loadData() {
  isInitialLoading.value = true;
  try {
    if (activeTab.value === 'today') {
      const tasks = await taskApi.today();
      taskStore.tasks = Array.isArray(tasks) ? tasks : [];
      taskStore.total = taskStore.tasks.length;
    } else if (activeTab.value === 'planned') {
      const res = await taskApi.planned(1);
      taskStore.tasks = res.data;
      taskStore.total = res.total;
    } else {
      await taskStore.fetchTasks(getFilter());
    }
    finished.value = taskStore.tasks.length >= taskStore.total && taskStore.total > 0;
  } finally {
    isInitialLoading.value = false;
  }
}

function onLoad() {
  taskStore.loadMore().then(() => {
    if (taskStore.tasks.length >= taskStore.total) finished.value = true;
    listLoading.value = false;
  }).catch(() => { listLoading.value = false; });
}

async function onRefresh() {
  taskStore.resetPage();
  await loadData();
  refreshing.value = false;
  finished.value = taskStore.tasks.length >= taskStore.total;
}

const previousTab = ref('all');

function onTabChange(name: string) {
  const fromIdx = tabOrder[previousTab.value] ?? 0;
  const toIdx = tabOrder[name] ?? 0;
  tabTransition.value = toIdx > fromIdx ? 'slide-left' : 'slide-right';
  previousTab.value = name;

  taskStore.resetPage();
  taskStore.tasks = [];
  taskStore.total = 0;
  finished.value = false;
  loadData();
}

function onFilterApply(filter: Record<string, unknown>) {
  customFilter.value = filter;
  taskStore.resetPage();
  taskStore.tasks = [];
  finished.value = false;
  loadData();
}

function clearFilter() {
  customFilter.value = {};
  onTabChange(activeTab.value);
}

function handleToggle(id: string) {
  taskStore.toggleTask(id);
  showToast('状态已更新');
}
function handleDelete(id: string) {
  taskStore.deleteTask(id);
  showToast('已移入回收站');
}

async function handleCreate(dto: CreateTaskDto | UpdateTaskDto) {
  creating.value = true;
  try {
    await taskStore.createTask(dto as CreateTaskDto);
    showToast('任务已创建');
    showCreate.value = false;
  } finally { creating.value = false; }
}

loadData();
</script>

<template>
  <div class="page">
    <NavBar title="任务">
      <template #right>
        <van-icon name="filter-o" size="20" @click="showFilter = true" style="margin-right: 12px" />
        <van-icon name="search" size="20" @click="$router.push('/search')" />
      </template>
    </NavBar>
    <van-tabs v-model:active="activeTab" sticky @change="onTabChange">
      <van-tab title="全部" name="all" />
      <van-tab title="今天" name="today" />
      <van-tab title="计划" name="planned" />
      <van-tab title="已完成" name="completed" />
    </van-tabs>

    <div v-if="hasActiveFilter" class="active-filter-bar">
      <span>已应用筛选</span>
      <van-button size="mini" plain type="primary" @click="clearFilter">清除</van-button>
    </div>

    <div class="content">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <transition :name="tabTransition" mode="out-in">
          <div :key="activeTab" style="min-height: 60vh">
            <LoadingSkeleton v-if="isInitialLoading" />
            <template v-else>
              <van-list
                v-model:loading="listLoading"
                :finished="finished"
                finished-text="没有更多了"
                @load="onLoad"
              >
                <TaskCard
                  v-for="task in taskStore.tasks"
                  :key="task.id"
                  :task="task"
                  @toggle="handleToggle"
                  @delete="handleDelete"
                />
              </van-list>
              <EmptyState
                v-if="!listLoading && taskStore.tasks.length === 0"
                title="暂无任务"
                description="点击 + 创建你的第一个任务"
              />
            </template>
          </div>
        </transition>
      </van-pull-refresh>
    </div>

    <TaskFilter v-model:visible="showFilter" @apply="onFilterApply" />

    <div class="fab-wrapper">
      <van-button type="primary" round icon="plus" @click="showCreate = true" />
    </div>

    <van-popup v-model:show="showCreate" position="bottom" round :style="{ height: '80%' }">
      <div class="popup-header">
        <span>新建任务</span>
        <van-icon name="cross" size="20" @click="showCreate = false" />
      </div>
      <TaskForm :loading="creating" @submit="handleCreate" />
    </van-popup>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 50px; }
.content { min-height: 60vh; }
.active-filter-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 16px; background: var(--color-primary); color: white;
  font-size: var(--font-size-xs);
}
.fab-wrapper { position: fixed; bottom: 70px; right: 20px; z-index: 100; }
.fab-wrapper :deep(.van-button) { width: 48px; height: 48px; border-radius: 50%; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
.popup-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px; font-size: var(--font-size-lg); font-weight: 600;
}
</style>
