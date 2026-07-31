import type { Priority } from './enums.js';

export interface Task {
  id: string;
  userId: string;
  listId: string | null;
  title: string;
  description: string;
  priority: Priority;
  isCompleted: boolean;
  completedAt: string | null;
  dueDate: string | null;
  dueTime: string | null;
  sortOrder: number;
  isPinned: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** 关联数据 —— 仅在详情接口返回 */
  tags?: TagInfo[];
  subTasks?: SubTaskInfo[];
  subTaskCount?: { total: number; completed: number } | null;
  reminders?: ReminderInfo[];
  list?: ListInfo;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  listId?: string | null;
  priority?: Priority;
  dueDate?: string | null;
  dueTime?: string | null;
  tagIds?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  listId?: string | null;
  priority?: Priority;
  isCompleted?: boolean;
  dueDate?: string | null;
  dueTime?: string | null;
  sortOrder?: number;
  isPinned?: boolean;
}

export interface TaskFilterDto {
  listId?: string;
  priority?: Priority;
  status?: 'all' | 'active' | 'completed';
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
  tagIds?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'sortOrder';
  sortOrder?: 'asc' | 'desc';
  isPinned?: boolean;
}

export interface BatchTaskDto {
  action: 'delete' | 'complete' | 'updatePriority' | 'moveToList' | 'updateTags';
  taskIds: string[];
  payload?: {
    priority?: Priority;
    listId?: string;
    tagIds?: string[];
  };
}

export interface MoveTaskDto {
  targetListId: string | null;
}

export interface BindTagsDto {
  tagIds: string[];
}

// ---- 轻量关联类型（详情中嵌套用） ----

export interface TagInfo {
  id: string;
  name: string;
  color: string;
}

export interface SubTaskInfo {
  id: string;
  text: string;
  isCompleted: boolean;
  sortOrder: number;
}

export interface ReminderInfo {
  id: string;
  remindAt: string;
  isRecurring: boolean;
  recurType: string;
  recurRule: string | null;
  isTriggered: boolean;
}

export interface ListInfo {
  id: string;
  name: string;
  color: string;
  icon: string;
}
