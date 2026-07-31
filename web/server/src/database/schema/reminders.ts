import { pgTable, uuid, varchar, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { recurTypeEnum } from './enums.js';

export const reminders = pgTable('reminder', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  remindAt: timestamp('remind_at', { withTimezone: true }).notNull(),
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurType: recurTypeEnum('recur_type').notNull().default('none'),
  recurRule: varchar('recur_rule', { length: 100 }),
  isTriggered: boolean('is_triggered').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  taskIdx: index('idx_reminder_task').on(table.taskId),
  triggerIdx: index('idx_reminder_trigger').on(table.remindAt).where(sql`${table.isTriggered} = FALSE`),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  task: one(tasks, { fields: [reminders.taskId], references: [tasks.id] }),
}));

import { tasks } from './tasks.js';
