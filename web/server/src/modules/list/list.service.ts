import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq, and, sql, count as drizzleCount } from 'drizzle-orm';
import { DRIZZLE_DB } from '../../database/database.module.js';
import type { DbClient } from '../../config/database.config.js';
import { lists, tasks } from '../../database/schema/index.js';
import type { CreateListDto } from './dto/create-list.dto.js';
import type { UpdateListDto } from './dto/update-list.dto.js';
import type { ReorderListsDto } from './dto/reorder-lists.dto.js';
import type { ListStats } from '@todolist/shared';

@Injectable()
export class ListService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  async findAll(userId: string) {
    return this.db.select().from(lists).where(eq(lists.userId, userId)).orderBy(lists.sortOrder);
  }

  async create(userId: string, dto: CreateListDto) {
    const existing = await this.db
      .select()
      .from(lists)
      .where(and(eq(lists.userId, userId), eq(lists.name, dto.name)))
      .limit(1);
    if (existing.length > 0) throw new ConflictException('清单名称已存在');

    const [list] = await this.db
      .insert(lists)
      .values({ userId, name: dto.name, color: dto.color, icon: dto.icon })
      .returning();
    return list;
  }

  async findOne(userId: string, listId: string) {
    const [list] = await this.db
      .select()
      .from(lists)
      .where(and(eq(lists.id, listId), eq(lists.userId, userId)))
      .limit(1);
    if (!list) throw new NotFoundException('清单不存在');
    return list;
  }

  async update(userId: string, listId: string, dto: UpdateListDto) {
    await this.findOne(userId, listId);
    const [updated] = await this.db
      .update(lists)
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(lists.id, listId), eq(lists.userId, userId)))
      .returning();
    return updated;
  }

  async remove(userId: string, listId: string) {
    const list = await this.findOne(userId, listId);
    if (list.isBuiltin) throw new ForbiddenException('内置清单不可删除');

    await this.db
      .update(tasks)
      .set({ listId: null })
      .where(and(eq(tasks.listId, listId), eq(tasks.userId, userId)));

    await this.db.delete(lists).where(and(eq(lists.id, listId), eq(lists.userId, userId)));
    return { message: 'List deleted' };
  }

  async reorder(userId: string, dto: ReorderListsDto) {
    for (const item of dto.items) {
      await this.db
        .update(lists)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(and(eq(lists.id, item.id), eq(lists.userId, userId)));
    }
    return { message: 'Reordered' };
  }

  async getStats(userId: string, listId: string): Promise<ListStats> {
    await this.findOne(userId, listId);

    const [result] = await this.db
      .select({
        total: drizzleCount(),
        completed: sql<number>`SUM(CASE WHEN ${tasks.isCompleted} THEN 1 ELSE 0 END)::int`,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.listId, listId),
          eq(tasks.userId, userId),
          sql`${tasks.deletedAt} IS NULL`,
        ),
      );

    const total = result?.total ?? 0;
    const completed = result?.completed ?? 0;
    return {
      total,
      completed,
      active: total - completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}
