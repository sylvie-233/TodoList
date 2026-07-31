import { pgEnum } from 'drizzle-orm/pg-core';

export const priorityEnum = pgEnum('priority_enum', [
  'none',
  'low',
  'medium',
  'high',
  'urgent',
]);

export const recurTypeEnum = pgEnum('recur_type_enum', [
  'none',
  'daily',
  'weekly',
  'monthly',
  'custom',
]);
