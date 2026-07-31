import { get, post, patch, del } from '../request.js';
import type { Tag, CreateTagDto, UpdateTagDto } from '@todolist/shared';

export const tagApi = {
  all: () => get<Tag[]>('/tags'),
  create: (dto: CreateTagDto) => post<Tag>('/tags', dto),
  update: (id: string, dto: UpdateTagDto) => patch<Tag>(`/tags/${id}`, dto),
  remove: (id: string) => del(`/tags/${id}`),
};
