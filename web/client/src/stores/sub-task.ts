import { defineStore } from 'pinia';
import { ref } from 'vue';
import { subTaskApi } from '@/api/index.js';
import type { SubTask, CreateSubTaskDto, UpdateSubTaskDto, ReorderSubTasksDto } from '@todolist/shared';

export const useSubTaskStore = defineStore('subTask', () => {
  const subTasks = ref<SubTask[]>([]);
  const loading = ref(false);

  async function createSubTask(dto: CreateSubTaskDto) {
    const st = await subTaskApi.create(dto);
    subTasks.value.push(st);
    return st;
  }

  async function updateSubTask(id: string, dto: UpdateSubTaskDto) {
    const updated = await subTaskApi.update(id, dto);
    const idx = subTasks.value.findIndex((s) => s.id === id);
    if (idx >= 0) subTasks.value[idx] = updated;
    return updated;
  }

  async function toggleSubTask(id: string) {
    const updated = await subTaskApi.toggle(id);
    const idx = subTasks.value.findIndex((s) => s.id === id);
    if (idx >= 0) subTasks.value[idx] = updated;
  }

  async function deleteSubTask(id: string) {
    await subTaskApi.remove(id);
    subTasks.value = subTasks.value.filter((s) => s.id !== id);
  }

  async function reorderSubTasks(dto: ReorderSubTasksDto) {
    await subTaskApi.reorder(dto);
  }

  function setSubTasks(list: SubTask[]) {
    subTasks.value = list;
  }

  return { subTasks, loading, createSubTask, updateSubTask, toggleSubTask, deleteSubTask, reorderSubTasks, setSubTasks };
});
