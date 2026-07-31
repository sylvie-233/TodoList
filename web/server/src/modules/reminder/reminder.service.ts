import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { DRIZZLE_DB } from '../../database/database.module.js';
import type { DbClient } from '../../config/database.config.js';
import { reminders, tasks, recurTypeEnum } from '../../database/schema/index.js';
import type { CreateReminderDto } from './dto/create-reminder.dto.js';
import type { UpdateReminderDto } from './dto/update-reminder.dto.js';
import type { CalendarQueryDto } from './dto/calendar-query.dto.js';

const PAGE_SIZE = 20;

@Injectable()
export class ReminderService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  async create(userId: string, dto: CreateReminderDto) {
    await this.ensureTaskOwnership(userId, dto.taskId);
    const [reminder] = await this.db
      .insert(reminders)
      .values({
        taskId: dto.taskId,
        remindAt: new Date(dto.remindAt),
        isRecurring: dto.isRecurring ?? false,
        recurType: (dto.recurType ?? 'none') as typeof recurTypeEnum.enumValues[number],
        recurRule: dto.recurRule ?? null,
      })
      .returning();
    return reminder;
  }

  async update(userId: string, reminderId: string, dto: UpdateReminderDto) {
    const reminder = await this.ensureReminderExists(reminderId);
    await this.ensureTaskOwnership(userId, reminder.taskId);

    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.remindAt) set.remindAt = new Date(dto.remindAt);
    if (dto.isRecurring !== undefined) set.isRecurring = dto.isRecurring;
    if (dto.recurType) set.recurType = dto.recurType;
    if (dto.recurRule !== undefined) set.recurRule = dto.recurRule;

    const [updated] = await this.db
      .update(reminders)
      .set(set)
      .where(eq(reminders.id, reminderId))
      .returning();
    return updated;
  }

  async remove(userId: string, reminderId: string) {
    const reminder = await this.ensureReminderExists(reminderId);
    await this.ensureTaskOwnership(userId, reminder.taskId);
    await this.db.delete(reminders).where(eq(reminders.id, reminderId));
    return { message: 'Reminder deleted' };
  }

  async getUpcoming(userId: string, page: number) {
    const pageSize = PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const where = and(
      eq(tasks.userId, userId),
      gte(reminders.remindAt, new Date()),
      eq(reminders.isTriggered, false),
      sql`${tasks.deletedAt} IS NULL`,
    );

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(reminders)
      .innerJoin(tasks, eq(reminders.taskId, tasks.id))
      .where(where);

    const total = countResult?.count ?? 0;
    const data = await this.db
      .select({
        reminder: reminders,
        taskTitle: tasks.title,
      })
      .from(reminders)
      .innerJoin(tasks, eq(reminders.taskId, tasks.id))
      .where(where)
      .orderBy(reminders.remindAt)
      .limit(pageSize)
      .offset(offset);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getCalendarRange(userId: string, query: CalendarQueryDto) {
    return this.db
      .select({
        reminder: reminders,
        taskTitle: tasks.title,
        taskDueDate: tasks.dueDate,
      })
      .from(reminders)
      .innerJoin(tasks, eq(reminders.taskId, tasks.id))
      .where(
        and(
          eq(tasks.userId, userId),
          gte(reminders.remindAt, new Date(query.startDate)),
          lte(reminders.remindAt, new Date(query.endDate)),
          sql`${tasks.deletedAt} IS NULL`,
        ),
      )
      .orderBy(reminders.remindAt);
  }

  private async ensureTaskOwnership(userId: string, taskId: string) {
    const [task] = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);
    if (!task) throw new NotFoundException('任务不存在');
    return task;
  }

  private async ensureReminderExists(reminderId: string) {
    const [reminder] = await this.db
      .select()
      .from(reminders)
      .where(eq(reminders.id, reminderId))
      .limit(1);
    if (!reminder) throw new NotFoundException('提醒不存在');
    return reminder;
  }
}
