import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  time,
  integer,
  boolean,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { priorityEnum } from './enums.js';

export const tasks = pgTable('task', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  listId: uuid('list_id').references(() => lists.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').default(''),
  priority: priorityEnum('priority').notNull().default('none'),
  isCompleted: boolean('is_completed').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  dueDate: date('due_date'),
  dueTime: time('due_time'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPinned: boolean('is_pinned').notNull().default(false),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  titleNotEmpty: check('chk_title_not_empty', sql`char_length(${table.title}) > 0`),
  userListIdx: index('idx_task_user_list').on(table.userId, table.listId).where(sql`${table.deletedAt} IS NULL`),
  userDueIdx: index('idx_task_user_due').on(table.userId, table.dueDate).where(sql`${table.deletedAt} IS NULL`),
  userPriorityIdx: index('idx_task_user_priority').on(table.userId, table.priority).where(sql`${table.deletedAt} IS NULL`),
  userStatusIdx: index('idx_task_user_status').on(table.userId, table.isCompleted).where(sql`${table.deletedAt} IS NULL`),
  sortIdx: index('idx_task_sort').on(table.listId, table.sortOrder).where(sql`${table.deletedAt} IS NULL`),
  deletedIdx: index('idx_task_deleted').on(table.userId, table.deletedAt).where(sql`${table.deletedAt} IS NOT NULL`),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  list: one(lists, { fields: [tasks.listId], references: [lists.id] }),
  subTasks: many(subTasks),
  taskTags: many(taskTags),
  reminders: many(reminders),
}));

import { users } from './users.js';
import { lists } from './lists.js';
import { subTasks } from './sub-tasks.js';
import { taskTags } from './task-tags.js';
import { reminders } from './reminders.js';
