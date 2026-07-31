export { priorityEnum, recurTypeEnum } from './enums.js';
export { users, usersRelations } from './users.js';
export { lists, listsRelations } from './lists.js';
export { tasks, tasksRelations } from './tasks.js';
export { subTasks, subTasksRelations } from './sub-tasks.js';
export { tags, tagsRelations } from './tags.js';
export { taskTags, taskTagsRelations } from './task-tags.js';
export { reminders, remindersRelations } from './reminders.js';
export { searchHistories, searchHistoriesRelations } from './search-history.js';

import * as allSchemas from './users.js';
import * as lists from './lists.js';
import * as tasks from './tasks.js';
import * as subTasks from './sub-tasks.js';
import * as tags from './tags.js';
import * as taskTags from './task-tags.js';
import * as reminders from './reminders.js';
import * as searchHistory from './search-history.js';

export const schema = {
  ...allSchemas,
  ...lists,
  ...tasks,
  ...subTasks,
  ...tags,
  ...taskTags,
  ...reminders,
  ...searchHistory,
};

// ---- 类型导出 ----
export type User = typeof allSchemas.users.$inferSelect;
export type NewUser = typeof allSchemas.users.$inferInsert;
export type List = typeof lists.lists.$inferSelect;
export type NewList = typeof lists.lists.$inferInsert;
export type Task = typeof tasks.tasks.$inferSelect;
export type NewTask = typeof tasks.tasks.$inferInsert;
export type SubTask = typeof subTasks.subTasks.$inferSelect;
export type NewSubTask = typeof subTasks.subTasks.$inferInsert;
export type Tag = typeof tags.tags.$inferSelect;
export type NewTag = typeof tags.tags.$inferInsert;
export type TaskTag = typeof taskTags.taskTags.$inferSelect;
export type NewTaskTag = typeof taskTags.taskTags.$inferInsert;
export type Reminder = typeof reminders.reminders.$inferSelect;
export type NewReminder = typeof reminders.reminders.$inferInsert;
export type SearchHistory = typeof searchHistory.searchHistories.$inferSelect;
export type NewSearchHistory = typeof searchHistory.searchHistories.$inferInsert;
