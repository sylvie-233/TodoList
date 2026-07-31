import { Injectable, Inject } from '@nestjs/common';
import { eq, and, lt, sql } from 'drizzle-orm';
import { DRIZZLE_DB } from '../../database/database.module.js';
import type { DbClient } from '../../config/database.config.js';
import { tasks } from '../../database/schema/index.js';

@Injectable()
export class StatisticsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  async getDashboard(userId: string) {
    const baseWhere = and(
      eq(tasks.userId, userId),
      sql`${tasks.deletedAt} IS NULL`,
    );

    const [summary] = await this.db
      .select({
        total: sql<number>`count(*)::int`,
        completed: sql<number>`SUM(CASE WHEN ${tasks.isCompleted} THEN 1 ELSE 0 END)::int`,
      })
      .from(tasks)
      .where(baseWhere);

    const total = summary?.total ?? 0;
    const completed = summary?.completed ?? 0;

    const todayStr = new Date().toISOString().slice(0, 10);
    const [overdueCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(
        and(
          baseWhere,
          sql`${tasks.dueDate} < ${todayStr}`,
          eq(tasks.isCompleted, false),
        ),
      );

    const [todayCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(
        and(
          baseWhere,
          sql`${tasks.dueDate} = ${todayStr}`,
        ),
      );

    return {
      totalTasks: total,
      completedTasks: completed,
      activeTasks: total - completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      overdueCount: overdueCount?.count ?? 0,
      todayCount: todayCount?.count ?? 0,
    };
  }

  async getTrends(userId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    const startStr = startDate.toISOString().slice(0, 10);

    const rows = await this.db
      .select({
        date: sql<string>`DATE(${tasks.completedAt})::text`,
        completed: sql<number>`count(*)::int`,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          sql`${tasks.deletedAt} IS NULL`,
          sql`${tasks.completedAt} >= ${startStr}`,
        ),
      )
      .groupBy(sql`DATE(${tasks.completedAt})`)
      .orderBy(sql`DATE(${tasks.completedAt})`);

    // 填充空白日期
    const result = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - days + i + 1);
      const dateStr = d.toISOString().slice(0, 10);
      const row = rows.find((r) => r.date === dateStr);
      result.push({
        date: dateStr,
        completed: row?.completed ?? 0,
        created: 0, // 简化处理
      });
    }

    return result;
  }

  async getOverdue(userId: string) {
    const todayStr = new Date().toISOString().slice(0, 10);

    const items = await this.db
      .select({
        id: tasks.id,
        title: tasks.title,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          sql`${tasks.deletedAt} IS NULL`,
          sql`${tasks.dueDate} < ${todayStr}`,
          eq(tasks.isCompleted, false),
        ),
      )
      .orderBy(tasks.dueDate);

    const now = new Date();
    const result = items.map((item) => {
      const dueDate = new Date(item.dueDate!);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return { ...item, daysOverdue };
    });

    return { total: result.length, items: result };
  }
}
