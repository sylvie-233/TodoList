import { get, post, patch, del } from '../request.js';
import type { List, CreateListDto, UpdateListDto, ReorderListsDto, ListStats } from '@todolist/shared';

export const listApi = {
  all: () => get<List[]>('/lists'),
  create: (dto: CreateListDto) => post<List>('/lists', dto),
  detail: (id: string) => get<List>(`/lists/${id}`),
  update: (id: string, dto: UpdateListDto) => patch<List>(`/lists/${id}`, dto),
  remove: (id: string) => del(`/lists/${id}`),
  reorder: (dto: ReorderListsDto) => patch('/lists/reorder', dto),
  stats: (id: string) => get<ListStats>(`/lists/${id}/stats`),
};
