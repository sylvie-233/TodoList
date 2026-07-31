import { get, post, patch, del } from '../request.js';
import type {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilterDto,
  BatchTaskDto,
  MoveTaskDto,
  BindTagsDto,
  PaginatedResponse,
  SubTask,
} from '@todolist/shared';

export const taskApi = {
  list: (filter?: TaskFilterDto) => get<PaginatedResponse<Task>>('/tasks', filter as Record<string, unknown>),
  today: () => get<Task[]>('/tasks/today'),
  planned: (page?: number) => get<PaginatedResponse<Task>>('/tasks/planned', { page }),
  completed: (page?: number) => get<PaginatedResponse<Task>>('/tasks/completed', { page }),
  recycleBin: (page?: number) => get<PaginatedResponse<Task>>('/tasks/recycle-bin', { page }),
  create: (dto: CreateTaskDto) => post<Task>('/tasks', dto),
  detail: (id: string) => get<Task>(`/tasks/${id}`),
  update: (id: string, dto: UpdateTaskDto) => patch<Task>(`/tasks/${id}`, dto),
  toggle: (id: string) => patch<Task>(`/tasks/${id}/toggle`),
  move: (id: string, dto: MoveTaskDto) => post<Task>(`/tasks/${id}/move`, dto),
  copy: (id: string) => post<Task>(`/tasks/${id}/copy`),
  softDelete: (id: string) => del(`/tasks/${id}`),
  restore: (id: string) => patch(`/tasks/${id}/restore`),
  permanentDelete: (id: string) => del(`/tasks/${id}/permanent`),
  batch: (dto: BatchTaskDto) => post('/tasks/batch', dto),
  bindTags: (id: string, dto: BindTagsDto) => post(`/tasks/${id}/tags`, dto),
  subTasks: (id: string) => get<SubTask[]>(`/tasks/${id}/sub-tasks`),
};
