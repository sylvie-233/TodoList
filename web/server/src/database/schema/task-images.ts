import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const taskImages = pgTable('task_image', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 500 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  taskIdx: index('idx_task_image_task').on(table.taskId),
}));

export const taskImagesRelations = relations(taskImages, ({ one }) => ({
  task: one(tasks, { fields: [taskImages.taskId], references: [tasks.id] }),
}));

import { tasks } from './tasks.js';
