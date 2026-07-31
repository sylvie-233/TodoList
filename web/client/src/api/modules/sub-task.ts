import { post, patch, del } from '../request.js';
import type { SubTask, CreateSubTaskDto, UpdateSubTaskDto } from '@todolist/shared';

export const subTaskApi = {
  create: (dto: CreateSubTaskDto) => post<SubTask>('/sub-tasks', dto),
  update: (id: string, dto: UpdateSubTaskDto) => patch<SubTask>(`/sub-tasks/${id}`, dto),
  toggle: (id: string) => patch<SubTask>(`/sub-tasks/${id}/toggle`),
  remove: (id: string) => del(`/sub-tasks/${id}`),
  reorder: (items: { id: string; sortOrder: number }[]) => patch('/sub-tasks/reorder', { items }),
};
