import { defineStore } from 'pinia';
import { ref } from 'vue';
import { taskApi } from '@/api/index.js';
import type { Task, CreateTaskDto, UpdateTaskDto, BatchTaskDto, MoveTaskDto, BindTagsDto } from '@todolist/shared';

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([]);
  const currentTask = ref<Task | null>(null);
  const loading = ref(false);
  const total = ref(0);
  const page = ref(1);
  const currentFilter = ref<Record<string, unknown>>({});
  const pageSize = 20;

  async function fetchTasks(filter?: Record<string, unknown>) {
    loading.value = true;
    page.value = 1;
    currentFilter.value = filter ?? {};
    try {
      const res = await taskApi.list({ ...filter, page: 1, pageSize } as never);
      tasks.value = res.data;
      total.value = res.total;
    } finally {
      loading.value = false;
    }
  }

  async function loadMore() {
    page.value++;
    try {
      const res = await taskApi.list({ ...currentFilter.value, page: page.value, pageSize } as never);
      tasks.value.push(...res.data);
      total.value = res.total;
    } catch {
      page.value--;
      throw new Error('加载失败');
    }
  }

  async function fetchTaskById(id: string) {
    loading.value = true;
    try {
      currentTask.value = await taskApi.detail(id);
    } finally {
      loading.value = false;
    }
  }

  async function createTask(dto: CreateTaskDto) {
    const task = await taskApi.create(dto);
    tasks.value.unshift(task);
    total.value++;
    return task;
  }

  async function updateTask(id: string, dto: UpdateTaskDto) {
    const updated = await taskApi.update(id, dto);
    const idx = tasks.value.findIndex((t) => t.id === id);
    if (idx >= 0) tasks.value[idx] = { ...tasks.value[idx], ...updated };
    if (currentTask.value?.id === id) {
      currentTask.value = { ...currentTask.value, ...updated };
    }
    return updated;
  }

  async function toggleTask(id: string) {
    const updated = await taskApi.toggle(id);
    const idx = tasks.value.findIndex((t) => t.id === id);
    if (idx >= 0) tasks.value[idx] = { ...tasks.value[idx], ...updated };
    if (currentTask.value?.id === id) {
      currentTask.value = { ...currentTask.value, ...updated };
    }
  }

  async function deleteTask(id: string) {
    await taskApi.softDelete(id);
    tasks.value = tasks.value.filter((t) => t.id !== id);
    total.value = Math.max(0, total.value - 1);
  }

  async function restoreTask(id: string) {
    await taskApi.restore(id);
    tasks.value = tasks.value.filter((t) => t.id !== id);
    total.value = Math.max(0, total.value - 1);
  }

  async function permanentDeleteTask(id: string) {
    await taskApi.permanentDelete(id);
    tasks.value = tasks.value.filter((t) => t.id !== id);
    total.value = Math.max(0, total.value - 1);
  }

  async function moveTask(id: string, dto: MoveTaskDto) {
    await taskApi.move(id, dto);
    tasks.value = tasks.value.filter((t) => t.id !== id);
    total.value = Math.max(0, total.value - 1);
  }

  async function copyTask(id: string) {
    return taskApi.copy(id);
  }

  async function batchAction(dto: BatchTaskDto) {
    await taskApi.batch(dto);
  }

  async function bindTags(id: string, dto: BindTagsDto) {
    await taskApi.bindTags(id, dto);
  }

  function resetPage() {
    page.value = 1;
  }

  return {
    tasks, currentTask, loading, total, page, currentFilter,
    fetchTasks, loadMore, fetchTaskById, createTask, updateTask, toggleTask,
    deleteTask, restoreTask, permanentDeleteTask, moveTask, copyTask,
    batchAction, bindTags, resetPage,
  };
});
