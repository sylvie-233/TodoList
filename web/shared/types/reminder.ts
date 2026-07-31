import type { RecurType } from './enums.js';

export interface Reminder {
  id: string;
  taskId: string;
  remindAt: string;
  isRecurring: boolean;
  recurType: RecurType;
  recurRule: string | null;
  isTriggered: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderDto {
  taskId: string;
  remindAt: string;
  isRecurring?: boolean;
  recurType?: RecurType;
  recurRule?: string;
}

export interface UpdateReminderDto {
  remindAt?: string;
  isRecurring?: boolean;
  recurType?: RecurType;
  recurRule?: string;
}

export interface CalendarQueryDto {
  startDate: string;
  endDate: string;
}
