export interface SearchQuery {
  keyword?: string;
  priority?: string;
  listId?: string;
  tagId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: 'all' | 'active' | 'completed';
  page?: number;
  pageSize?: number;
}

export interface SearchHistoryItem {
  id: string;
  userId: string;
  keyword: string;
  createdAt: string;
}
