import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const searchHistories = pgTable('search_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  keyword: varchar('keyword', { length: 200 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('idx_search_history_user').on(table.userId, table.createdAt.desc()),
}));

export const searchHistoriesRelations = relations(searchHistories, ({ one }) => ({
  user: one(users, { fields: [searchHistories.userId], references: [users.id] }),
}));

import { users } from './users.js';
