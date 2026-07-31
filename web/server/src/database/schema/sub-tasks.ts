import { pgTable, uuid, varchar, integer, boolean, timestamp, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const subTasks = pgTable('sub_task', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  text: varchar('text', { length: 500 }).notNull(),
  isCompleted: boolean('is_completed').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  textNotEmpty: check('chk_subtask_text_not_empty', sql`char_length(${table.text}) > 0`),
  taskIdx: index('idx_subtask_task').on(table.taskId, table.sortOrder),
}));

export const subTasksRelations = relations(subTasks, ({ one }) => ({
  task: one(tasks, { fields: [subTasks.taskId], references: [tasks.id] }),
}));

import { tasks } from './tasks.js';
