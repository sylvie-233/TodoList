import { pgTable, uuid, varchar, integer, boolean, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const lists = pgTable('list', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }).default('#6366f1'),
  icon: varchar('icon', { length: 50 }).default('list'),
  sortOrder: integer('sort_order').notNull().default(0),
  isBuiltin: boolean('is_builtin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userUnique: uniqueIndex('idx_list_user_name').on(table.userId, table.name),
  sortIdx: index('idx_list_sort').on(table.userId, table.sortOrder),
}));

export const listsRelations = relations(lists, ({ one, many }) => ({
  user: one(users, { fields: [lists.userId], references: [users.id] }),
  tasks: many(tasks),
}));

import { users } from './users.js';
import { tasks } from './tasks.js';
