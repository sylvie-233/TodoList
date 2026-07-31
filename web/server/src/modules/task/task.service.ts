import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, and, or, like, inArray, sql, asc, desc, ilike } from 'drizzle-orm';
import { DRIZZLE_DB } from '../../database/database.module.js';
import type { DbClient } from '../../config/database.config.js';
import {
  tasks,
  taskTags,
  tags,
  subTasks,
  reminders,
  lists,
  taskImages,
  priorityEnum,
} from '../../database/schema/index.js';
import type { CreateTaskDto } from './dto/create-task.dto.js';
import type { UpdateTaskDto } from './dto/update-task.dto.js';
import type { TaskFilterDto } from './dto/task-filter.dto.js';
import type { BatchTaskDto } from './dto/batch-task.dto.js';
import type { MoveTaskDto } from './dto/move-task.dto.js';
import type { BindTagsDto } from './dto/bind-tags.dto.js';

const PAGE_SIZE = 20;

@Injectable()
export class TaskService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  // ---- 通用分页查询 ----
  async findAll(userId: string, filter: TaskFilterDto) {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const conditions: ReturnType<typeof and>[] = [
      eq(tasks.userId, userId),
      sql`${tasks.deletedAt} IS NULL`,
    ];

    if (filter.listId) conditions.push(eq(tasks.listId, filter.listId));
    if (filter.priority) conditions.push(eq(tasks.priority, filter.priority as typeof priorityEnum.enumValues[number]));
    if (filter.status === 'active') conditions.push(eq(tasks.isCompleted, false));
    if (filter.status === 'completed') conditions.push(eq(tasks.isCompleted, true));
    if (filter.keyword) {
      conditions.push(
        or(
          ilike(tasks.title, `%${filter.keyword}%`),
          ilike(tasks.description, `%${filter.keyword}%`),
        )!,
      );
    }
    if (filter.dateFrom) conditions.push(sql`${tasks.dueDate} >= ${filter.dateFrom}`);
    if (filter.dateTo) conditions.push(sql`${tasks.dueDate} <= ${filter.dateTo}`);
    if (filter.isPinned !== undefined) conditions.push(eq(tasks.isPinned, filter.isPinned));

    // tag 筛选
    if (filter.tagIds && filter.tagIds.length > 0) {
      const taskIdsByTags = await this.db
        .select({ taskId: taskTags.taskId })
        .from(taskTags)
        .where(inArray(taskTags.tagId, filter.tagIds));
      const ids = [...new Set(taskIdsByTags.map((t) => t.taskId))];
      if (ids.length > 0) {
        conditions.push(inArray(tasks.id, ids));
      } else {
        return { data: [], total: 0, page, pageSize, totalPages: 0 };
      }
    }

    const where = and(...conditions);

    const orderFn = filter.sortOrder === 'asc' ? asc : desc;
    let orderBy;
    switch (filter.sortBy) {
      case 'dueDate':
        orderBy = orderFn(tasks.dueDate);
        break;
      case 'priority':
        orderBy = orderFn(tasks.priority);
        break;
      case 'sortOrder':
        orderBy = orderFn(tasks.sortOrder);
        break;
      case 'updatedAt':
        orderBy = orderFn(tasks.updatedAt);
        break;
      default:
        orderBy = desc(tasks.isPinned), desc(tasks.createdAt);
    }

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(where);

    const total = countResult?.count ?? 0;
    const rows = await this.db
      .select()
      .from(tasks)
      .where(where)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    const data = await this.attachTaskRelations(rows);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // ---- 视图查询 ----
  async getToday(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await this.db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          sql`${tasks.deletedAt} IS NULL`,
          sql`${tasks.dueDate} <= ${today}`,
          eq(tasks.isCompleted, false),
        ),
      )
      .orderBy(desc(tasks.isPinned), asc(tasks.dueDate), asc(tasks.priority));
    return this.attachTaskRelations(rows);
  }

  async getPlanned(userId: string, page: number) {
    const pageSize = PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const where = and(
      eq(tasks.userId, userId),
      sql`${tasks.deletedAt} IS NULL`,
      sql`${tasks.dueDate} IS NOT NULL`,
      eq(tasks.isCompleted, false),
    );

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(where);

    const total = countResult?.count ?? 0;
    const rows = await this.db
      .select()
      .from(tasks)
      .where(where)
      .orderBy(asc(tasks.dueDate))
      .limit(pageSize)
      .offset(offset);

    const data = await this.attachTaskRelations(rows);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getCompleted(userId: string, page: number) {
    const pageSize = PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const where = and(
      eq(tasks.userId, userId),
      sql`${tasks.deletedAt} IS NULL`,
      eq(tasks.isCompleted, true),
    );

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(where);

    const total = countResult?.count ?? 0;
    const rows = await this.db
      .select()
      .from(tasks)
      .where(where)
      .orderBy(desc(tasks.completedAt))
      .limit(pageSize)
      .offset(offset);

    const data = await this.attachTaskRelations(rows);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getRecycleBin(userId: string, page: number) {
    const pageSize = PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const where = and(eq(tasks.userId, userId), sql`${tasks.deletedAt} IS NOT NULL`);

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(where);

    const total = countResult?.count ?? 0;
    const rows = await this.db
      .select()
      .from(tasks)
      .where(where)
      .orderBy(desc(tasks.deletedAt))
      .limit(pageSize)
      .offset(offset);

    const data = await this.attachTaskRelations(rows);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  // ---- CRUD ----
  async findOne(userId: string, taskId: string) {
    const [task] = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);
    if (!task) throw new NotFoundException('任务不存在');

    // 加载关联数据
    const taskTagRecords = await this.db
      .select({ id: tags.id, name: tags.name, color: tags.color })
      .from(taskTags)
      .innerJoin(tags, eq(taskTags.tagId, tags.id))
      .where(eq(taskTags.taskId, taskId));

    const subtaskRecords = await this.db
      .select()
      .from(subTasks)
      .where(eq(subTasks.taskId, taskId))
      .orderBy(subTasks.sortOrder);

    const reminderRecords = await this.db
      .select()
      .from(reminders)
      .where(eq(reminders.taskId, taskId));

    let listInfo = null;
    if (task.listId) {
      const [lst] = await this.db
        .select({ id: lists.id, name: lists.name, color: lists.color, icon: lists.icon })
        .from(lists)
        .where(eq(lists.id, task.listId))
        .limit(1);
      listInfo = lst ?? null;
    }

    return { ...task, tags: taskTagRecords, subTasks: subtaskRecords, reminders: reminderRecords, list: listInfo };
  }

  async create(userId: string, dto: CreateTaskDto) {
    const [task] = await this.db
      .insert(tasks)
      .values({
        userId,
        title: dto.title,
        description: dto.description,
        listId: dto.listId ?? null,
        priority: (dto.priority ?? 'none') as typeof priorityEnum.enumValues[number],
        dueDate: dto.dueDate ?? null,
        dueTime: dto.dueTime ?? null,
      })
      .returning();

    // 绑定标签
    if (dto.tagIds && dto.tagIds.length > 0) {
      await this.db.insert(taskTags).values(
        dto.tagIds.map((tagId: string) => ({ taskId: task.id, tagId })),
      );
    }

    // 绑定图片
    if (dto.imageUrls && dto.imageUrls.length > 0) {
      await this.db.insert(taskImages).values(
        dto.imageUrls.map((url: string) => ({ taskId: task.id, url })),
      );
    }

    return task;
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    await this.ensureOwnership(userId, taskId);

    const { tagIds, imageUrls, ...rest } = dto;
    const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
    if (dto.isCompleted === true) updateData.completedAt = new Date();
    if (dto.isCompleted === false) updateData.completedAt = null;

    const [updated] = await this.db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    // 更新标签绑定
    if (tagIds !== undefined) {
      await this.db.delete(taskTags).where(eq(taskTags.taskId, taskId));
      if (tagIds.length > 0) {
        await this.db.insert(taskTags).values(
          tagIds.map((tagId: string) => ({ taskId, tagId })),
        );
      }
    }

    // 更新图片
    if (imageUrls !== undefined) {
      await this.db.delete(taskImages).where(eq(taskImages.taskId, taskId));
      if (imageUrls.length > 0) {
        await this.db.insert(taskImages).values(
          imageUrls.map((url: string) => ({ taskId, url })),
        );
      }
    }

    return updated;
  }

  async toggle(userId: string, taskId: string) {
    const [task] = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);
    if (!task) throw new NotFoundException('任务不存在');

    const isCompleted = !task.isCompleted;
    const [updated] = await this.db
      .update(tasks)
      .set({
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning();
    return updated;
  }

  async move(userId: string, taskId: string, dto: MoveTaskDto) {
    await this.ensureOwnership(userId, taskId);
    const [updated] = await this.db
      .update(tasks)
      .set({ listId: dto.targetListId, updatedAt: new Date() })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    return updated;
  }

  async copy(userId: string, taskId: string) {
    const original = await this.ensureOwnership(userId, taskId);
    const [copy] = await this.db
      .insert(tasks)
      .values({
        userId: original.userId,
        listId: original.listId,
        title: `${original.title} (Copy)`,
        description: original.description,
        priority: original.priority,
        dueDate: original.dueDate,
        dueTime: original.dueTime,
        isCompleted: false,
      })
      .returning();
    return copy;
  }

  async softDelete(userId: string, taskId: string) {
    await this.ensureOwnership(userId, taskId);
    await this.db
      .update(tasks)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    return { message: 'Task moved to recycle bin' };
  }

  async restore(userId: string, taskId: string) {
    await this.ensureOwnership(userId, taskId);
    await this.db
      .update(tasks)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    return { message: 'Task restored' };
  }

  async permanentDelete(userId: string, taskId: string) {
    await this.ensureOwnership(userId, taskId);
    await this.db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    return { message: 'Task permanently deleted' };
  }

  // ---- 批量操作 ----
  async batch(userId: string, dto: BatchTaskDto) {
    const set: Record<string, unknown> = { updatedAt: new Date() };
    switch (dto.action) {
      case 'complete':
        set.isCompleted = true;
        set.completedAt = new Date();
        break;
      case 'delete':
        set.deletedAt = new Date();
        break;
      case 'updatePriority':
        if (dto.payload?.priority) set.priority = dto.payload.priority;
        break;
      case 'moveToList':
        set.listId = dto.payload?.listId ?? null;
        break;
    }

    for (const taskId of dto.taskIds) {
      await this.db
        .update(tasks)
        .set(set)
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    }

    // 标签批量更新
    if (dto.action === 'updateTags' && dto.payload?.tagIds) {
      for (const taskId of dto.taskIds) {
        await this.db.delete(taskTags).where(eq(taskTags.taskId, taskId));
        if (dto.payload.tagIds.length > 0) {
          await this.db.insert(taskTags).values(
            dto.payload.tagIds.map((tagId: string) => ({ taskId, tagId })),
          );
        }
      }
    }

    return { message: `Batch ${dto.action} completed for ${dto.taskIds.length} tasks` };
  }

  // ---- 标签绑定 ----
  async bindTags(userId: string, taskId: string, dto: BindTagsDto) {
    await this.ensureOwnership(userId, taskId);
    await this.db.delete(taskTags).where(eq(taskTags.taskId, taskId));
    if (dto.tagIds.length > 0) {
      await this.db.insert(taskTags).values(
        dto.tagIds.map((tagId: string) => ({ taskId, tagId })),
      );
    }
    return { message: 'Tags updated' };
  }

  // ---- 子任务查询 ----
  async getSubTasks(userId: string, taskId: string) {
    await this.ensureOwnership(userId, taskId);
    return this.db
      .select()
      .from(subTasks)
      .where(eq(subTasks.taskId, taskId))
      .orderBy(subTasks.sortOrder);
  }

  // ---- 图片管理 ----

  async getImages(userId: string, taskId: string) {
    await this.ensureOwnership(userId, taskId);
    return this.db.select().from(taskImages).where(eq(taskImages.taskId, taskId)).orderBy(taskImages.createdAt);
  }

  async addImage(userId: string, taskId: string, url: string) {
    await this.ensureOwnership(userId, taskId);
    const [img] = await this.db.insert(taskImages).values({ taskId, url }).returning();
    return img;
  }

  async deleteImage(userId: string, taskId: string, imageId: string) {
    await this.ensureOwnership(userId, taskId);
    await this.db.delete(taskImages).where(eq(taskImages.id, imageId));
    return { message: 'Image deleted' };
  }

  // ---- 内部工具 ----

  /** 批量加载标签、清单、子任务计数 */
  private async attachTaskRelations(taskRows: Array<{ id: string; listId: string | null; [key: string]: unknown }>) {
    const taskIds = taskRows.map((t) => t.id);
    const listIds = [...new Set(taskRows.map((t) => t.listId).filter(Boolean))] as string[];

    // 并行加载标签、清单、子任务计数
    const [tagRelations, listRows, subtaskCounts] = await Promise.all([
      taskIds.length > 0
        ? this.db
            .select({ taskId: taskTags.taskId, tag: tags })
            .from(taskTags)
            .innerJoin(tags, eq(taskTags.tagId, tags.id))
            .where(inArray(taskTags.taskId, taskIds))
        : [],
      listIds.length > 0
        ? this.db
            .select({ id: lists.id, name: lists.name, color: lists.color, icon: lists.icon })
            .from(lists)
            .where(inArray(lists.id, listIds))
        : [],
      taskIds.length > 0
        ? this.db
            .select({
              taskId: subTasks.taskId,
              total: sql<number>`count(*)::int`,
              completed: sql<number>`SUM(CASE WHEN ${subTasks.isCompleted} THEN 1 ELSE 0 END)::int`,
            })
            .from(subTasks)
            .where(inArray(subTasks.taskId, taskIds))
            .groupBy(subTasks.taskId)
        : [],
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

  private async ensureOwnership(userId: string, taskId: string) {
    const [task] = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);
    if (!task) throw new NotFoundException('任务不存在');
    return task;
  }
}
