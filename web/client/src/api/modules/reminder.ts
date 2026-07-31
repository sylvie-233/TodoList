import { get, post, patch, del } from '../request.js';
import type { Reminder, CreateReminderDto, UpdateReminderDto, CalendarQueryDto, PaginatedResponse } from '@todolist/shared';

export const reminderApi = {
  create: (dto: CreateReminderDto) => post<Reminder>('/reminders', dto),
  update: (id: string, dto: UpdateReminderDto) => patch<Reminder>(`/reminders/${id}`, dto),
  remove: (id: string) => del(`/reminders/${id}`),
  upcoming: (page?: number) => get<PaginatedResponse<Reminder & { taskTitle: string }>>('/reminders/upcoming', { page }),
  calendar: (query: CalendarQueryDto) => get<(Reminder & { taskTitle: string; taskDueDate: string | null })[]>('/reminders/calendar', query as unknown as Record<string, unknown>),
};
