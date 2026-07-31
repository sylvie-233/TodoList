import { defineStore } from 'pinia';
import { ref } from 'vue';
import { searchApi } from '@/api/index.js';
import type { Task, SearchHistoryItem, PaginatedResponse, SearchQuery } from '@todolist/shared';

export const useSearchStore = defineStore('search', () => {
  const results = ref<Task[]>([]);
  const history = ref<SearchHistoryItem[]>([]);
  const query = ref<SearchQuery>({});
  const loading = ref(false);
  const total = ref(0);

  async function search(queryParams: SearchQuery) {
    query.value = queryParams;
    loading.value = true;
    try {
      const res = await searchApi.search(queryParams) as PaginatedResponse<Task>;
      results.value = res.data;
      total.value = res.total;
    } finally {
      loading.value = false;
    }
  }

  async function fetchHistory() {
    history.value = await searchApi.history() as SearchHistoryItem[];
  }

  async function clearHistory() {
    await searchApi.clearHistory();
    history.value = [];
  }

  async function deleteHistoryItem(id: string) {
    await searchApi.deleteHistoryItem(id);
    history.value = history.value.filter((h) => h.id !== id);
  }

  return { results, history, query, loading, total, search, fetchHistory, clearHistory, deleteHistoryItem };
});
