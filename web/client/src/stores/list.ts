import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listApi } from '@/api/index.js';
import type { List, CreateListDto, UpdateListDto, ReorderListsDto, ListStats } from '@todolist/shared';

export const useListStore = defineStore('list', () => {
  const lists = ref<List[]>([]);
  const currentList = ref<List | null>(null);
  const currentStats = ref<ListStats | null>(null);
  const loading = ref(false);

  async function fetchLists() {
    loading.value = true;
    try {
      lists.value = await listApi.all();
    } finally {
      loading.value = false;
    }
  }

  async function fetchListById(id: string) {
    currentList.value = await listApi.detail(id);
  }

  async function createList(dto: CreateListDto) {
    const list = await listApi.create(dto);
    lists.value.push(list);
    return list;
  }

  async function updateList(id: string, dto: UpdateListDto) {
    const updated = await listApi.update(id, dto);
    const idx = lists.value.findIndex((l) => l.id === id);
    if (idx >= 0) lists.value[idx] = updated;
    return updated;
  }

  async function deleteList(id: string) {
    await listApi.remove(id);
    lists.value = lists.value.filter((l) => l.id !== id);
  }

  async function reorderLists(dto: ReorderListsDto) {
    await listApi.reorder(dto);
  }

  async function fetchStats(id: string) {
    currentStats.value = await listApi.stats(id);
  }

  return { lists, currentList, currentStats, loading, fetchLists, fetchListById, createList, updateList, deleteList, reorderLists, fetchStats };
});
