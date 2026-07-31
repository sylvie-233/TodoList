import { Injectable, Inject } from '@nestjs/common';
import { eq, and, or, ilike, inArray, sql, desc } from 'drizzle-orm';
import { DRIZZLE_DB } from '../../database/database.module.js';
import type { DbClient } from '../../config/database.config.js';
import { tasks, taskTags, tags, lists, subTasks, searchHistories, priorityEnum } from '../../database/schema/index.js';
import type { SearchQueryDto } from './dto/search-query.dto.js';

const PAGE_SIZE = 20;

@Injectable()
export class SearchService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  async search(userId: string, query: SearchQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const conditions: ReturnType<typeof and>[] = [
      eq(tasks.userId, userId),
      sql`${tasks.deletedAt} IS NULL`,
    ];

    if (query.keyword) {
      conditions.push(
        or(
          ilike(tasks.title, `%${query.keyword}%`),
          ilike(tasks.description, `%${query.keyword}%`),
        )!,
      );
    }
    if (query.priority) conditions.push(eq(tasks.priority, query.priority as typeof priorityEnum.enumValues[number]));
    if (query.listId) conditions.push(eq(tasks.listId, query.listId));
    if (query.status === 'active') conditions.push(eq(tasks.isCompleted, false));
    if (query.status === 'completed') conditions.push(eq(tasks.isCompleted, true));
    if (query.dateFrom) conditions.push(sql`${tasks.dueDate} >= ${query.dateFrom}`);
    if (query.dateTo) conditions.push(sql`${tasks.dueDate} <= ${query.dateTo}`);

    if (query.tagId) {
      const taggedTasks = await this.db
        .select({ taskId: taskTags.taskId })
        .from(taskTags)
        .where(eq(taskTags.tagId, query.tagId));
      const ids = taggedTasks.map((t) => t.taskId);
      if (ids.length > 0) conditions.push(inArray(tasks.id, ids));
      else return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    const where = and(...conditions);

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(where);

    const total = countResult?.count ?? 0;
    const rows = await this.db
      .select()
      .from(tasks)
      .where(where)
      .orderBy(desc(tasks.isPinned), desc(tasks.updatedAt))
      .limit(pageSize)
      .offset(offset);

    // 批量加载关联数据
    const data = await this.attachRelations(rows);

    // 保存搜索关键词到历史
    if (query.keyword && query.keyword.trim()) {
      const [existing] = await this.db
        .select()
        .from(searchHistories)
        .where(
          and(
            eq(searchHistories.userId, userId),
            eq(searchHistories.keyword, query.keyword.trim()),
          ),
        )
        .limit(1);
      if (!existing) {
        await this.db.insert(searchHistories).values({
          userId,
          keyword: query.keyword.trim(),
        });
      }
    }

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getHistory(userId: string) {
    return this.db
      .select()
      .from(searchHistories)
      .where(eq(searchHistories.userId, userId))
      .orderBy(desc(searchHistories.createdAt))
      .limit(20);
  }

  async clearHistory(userId: string) {
    await this.db.delete(searchHistories).where(eq(searchHistories.userId, userId));
    return { message: 'Search history cleared' };
  }

  async deleteHistoryItem(userId: string, id: string) {
    await this.db
      .delete(searchHistories)
      .where(and(eq(searchHistories.id, id), eq(searchHistories.userId, userId)));
    return { message: 'History item deleted' };
  }

  /** 批量加载标签、清单和子任务计数 */
  private async attachRelations(taskRows: Array<{ id: string; listId: string | null }>) {
    const taskIds = taskRows.map((t) => t.id);
    if (!taskIds.length) return [];

    const listIds = [...new Set(taskRows.map((t) => t.listId).filter(Boolean))] as string[];

    const [tagRelations, listRows, subtaskCounts] = await Promise.all([
      this.db.select({ taskId: taskTags.taskId, tag: tags })
        .from(taskTags).innerJoin(tags, eq(taskTags.tagId, tags.id))
        .where(inArray(taskTags.taskId, taskIds)),
      listIds.length > 0
        ? this.db.select({ id: lists.id, name: lists.name, color: lists.color, icon: lists.icon })
            .from(lists).where(inArray(lists.id, listIds))
        : [],
      this.db.select({
        taskId: subTasks.taskId,
        total: sql<number>`count(*)::int`,
        completed: sql<number>`SUM(CASE WHEN ${subTasks.isCompleted} THEN 1 ELSE 0 END)::int`,
      }).from(subTasks).where(inArray(subTasks.taskId, taskIds)).groupBy(subTasks.taskId),
    ]);

    const tagMap = new Map<string, Array<{ id: string; name: string; color: string }>>();
    for (const { taskId, tag } of tagRelations) {
      const arr = tagMap.get(taskId) || [];
      arr.push({ id: tag.id, name: tag.name, color: tag.color ?? '#a855f7' });
      tagMap.set(taskId, arr);
    }
    const listMap = new Map(listRows.map((l) => [l.id, { ...l, color: l.color ?? '#6366f1' }]));
    const subtaskMap = new Map(subtaskCounts.map((s) => [s.taskId, { total: s.total, completed: s.completed }]));

    return taskRows.map((t) => ({
      ...t,
      tags: tagMap.get(t.id) || [],
      list: t.listId ? listMap.get(t.listId) ?? null : null,
      subTaskCount: subtaskMap.get(t.id) ?? null,
    }));
  }
}
