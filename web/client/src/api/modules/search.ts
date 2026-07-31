import { get, del } from '../request.js';
import type { SearchQuery, PaginatedResponse, SearchHistoryItem, Task } from '@todolist/shared';

export const searchApi = {
  search: (query: SearchQuery) => get<PaginatedResponse<Task>>('/search', query as Record<string, unknown>),
  history: () => get<SearchHistoryItem[]>('/search/history'),
  clearHistory: () => del('/search/history'),
  deleteHistoryItem: (id: string) => del(`/search/history/${id}`),
};
