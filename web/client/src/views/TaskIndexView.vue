<script setup lang="ts">
import { ref, computed } from 'vue';
import { showConfirmDialog, showToast } from 'vant';
import { useTaskStore } from '@/stores/task.js';
import { taskApi } from '@/api/index.js';
import NavBar from '@/components/NavBar.vue';
import TaskCard from '@/components/TaskCard.vue';
import TaskForm from '@/components/TaskForm.vue';
import TaskFilter from '@/components/TaskFilter.vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingSkeleton from '@/components/LoadingSkeleton.vue';
import ImageUploader from '@/components/ImageUploader.vue';
import { useListStore } from '@/stores/list.js';
import type { CreateTaskDto, UpdateTaskDto } from '@todolist/shared';

const taskStore = useTaskStore();
const listStore = useListStore();
const activeTab = ref('today');
const tabTransition = ref('slide-left');

const tabOrder: Record<string, number> = {
  today: 0, planned: 1, lists: 2,
};
const refreshing = ref(false);
const listLoading = ref(false);
const finished = ref(false);
const showCreate = ref(false);
const creating = ref(false);
const createImages = ref<{ id?: string; url: string }[]>([]);
const showFilter = ref(false);
const isInitialLoading = ref(true);
const customFilter = ref<Record<string, unknown>>({});
const selectedListId = ref('');

const hasActiveFilter = computed(() => Object.keys(customFilter.value).length > 0);

function getFilter(): Record<string, unknown> {
  const base = { ...customFilter.value };
  if (activeTab.value === 'lists' && selectedListId.value) base.listId = selectedListId.value;
  // 今天 / 计划 tab 默认只看未完成的；清单 tab 不设限制，全部显示
  if (!base.status && activeTab.value !== 'lists') base.status = 'active';
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
    finished.value = taskStore.total === 0 || taskStore.tasks.length >= taskStore.total;
  } finally {
    isInitialLoading.value = false;
  }
}

function onLoad() {
  taskStore.loadMore().then(() => {
    finished.value = taskStore.tasks.length >= taskStore.total;
    listLoading.value = false;
  }).catch(() => { listLoading.value = false; });
}

async function onRefresh() {
  taskStore.resetPage();
  await loadData();
  refreshing.value = false;
}

const previousTab = ref('today');

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

function selectList(id: string) {
  selectedListId.value = id;
  taskStore.resetPage();
  taskStore.tasks = [];
  isInitialLoading.value = true;
  const filter: Record<string, unknown> = {};
  if (id) filter.listId = id;
  taskStore.fetchTasks(filter).finally(() => {
    finished.value = taskStore.total === 0 || taskStore.tasks.length >= taskStore.total;
    isInitialLoading.value = false;
  });
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

async function handleCreate(dto: CreateTaskDto | UpdateTaskDto) {
  creating.value = true;
  try {
    const payload = { ...(dto as CreateTaskDto), imageUrls: createImages.value.map((img) => img.url) };
    await taskStore.createTask(payload);
    showToast('任务已创建');
    createImages.value = [];
    showCreate.value = false;
  } finally { creating.value = false; }
}

listStore.fetchLists();
loadData();
</script>

<template>
  <div class="page">
    <NavBar title="任务">
      <template #right>
        <van-icon v-if="activeTab === 'lists'" name="filter-o" size="20" @click="showFilter = true" style="margin-right: 12px" />
        <van-icon name="search" size="20" @click="$router.push('/search')" />
      </template>
    </NavBar>
    <van-tabs v-model:active="activeTab" sticky @change="onTabChange">
      <van-tab title="今天" name="today" />
      <van-tab title="计划" name="planned" />
      <van-tab title="清单" name="lists" />
    </van-tabs>

    <!-- 清单选择器（仅清单 Tab 显示）-->
    <div v-if="activeTab === 'lists'" class="list-selector">
      <span
        class="ls-item" :class="{ active: !selectedListId }"
        @click="selectList('')"
      >全部</span>
      <span
        v-for="l in listStore.lists" :key="l.id"
        class="ls-item" :class="{ active: selectedListId === l.id }"
        :style="selectedListId === l.id ? { background: l.color, color: '#fff', borderColor: l.color } : {}"
        @click="selectList(l.id)"
      >
        <span class="ls-dot" :style="{ background: l.color }" />
        {{ l.name }}
      </span>
    </div>

    <div v-if="hasActiveFilter && activeTab === 'lists'" class="active-filter-bar">
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
      <TaskForm :loading="creating" @submit="handleCreate">
        <template #extra>
          <van-cell-group inset style="margin-top: 8px">
            <div class="create-img-section">
              <div class="create-img-label">图片</div>
              <ImageUploader :images="createImages" @add="(url) => createImages.push({ url })" @delete="(id) => { const i = createImages.findIndex((img) => (img.id || img.url) === id); if (i >= 0) createImages.splice(i, 1); }" />
            </div>
          </van-cell-group>
        </template>
      </TaskForm>
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
/* 清单选择器 */
.list-selector {
  display: flex; gap: 6px; padding: 8px 12px;
  overflow-x: auto; white-space: nowrap;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
}
.list-selector::-webkit-scrollbar { display: none; }
.ls-item {
  flex-shrink: 0; padding: 5px 12px;
  border-radius: 14px; font-size: var(--font-size-sm);
  background: var(--color-bg); color: var(--color-text-secondary);
  border: 1px solid transparent; cursor: pointer;
  display: flex; align-items: center; gap: 4px;
  transition: all 0.2s;
}
.ls-item.active {
  background: var(--color-primary); color: white;
}
.ls-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.create-img-section { padding: 12px 16px; }
.create-img-label { font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-bottom: 6px; }
</style>
