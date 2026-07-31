import { pgTable, uuid, primaryKey, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const taskTags = pgTable('task_tag', {
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.taskId, table.tagId] }),
  taskIdx: index('idx_task_tag_task').on(table.taskId),
  tagIdx: index('idx_task_tag_tag').on(table.tagId),
}));

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, { fields: [taskTags.taskId], references: [tasks.id] }),
  tag: one(tags, { fields: [taskTags.tagId], references: [tags.id] }),
}));

import { tasks } from './tasks.js';
import { tags } from './tags.js';
