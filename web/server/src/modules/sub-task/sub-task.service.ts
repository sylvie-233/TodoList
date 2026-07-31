import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE_DB } from '../../database/database.module.js';
import type { DbClient } from '../../config/database.config.js';
import { subTasks, tasks } from '../../database/schema/index.js';
import type { CreateSubTaskDto } from './dto/create-sub-task.dto.js';
import type { UpdateSubTaskDto } from './dto/update-sub-task.dto.js';
import type { ReorderSubTasksDto } from './dto/reorder-sub-tasks.dto.js';

@Injectable()
export class SubTaskService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  async create(userId: string, dto: CreateSubTaskDto) {
    await this.ensureTaskOwnership(userId, dto.taskId);

    const maxOrder = await this.db
      .select()
      .from(subTasks)
      .where(eq(subTasks.taskId, dto.taskId))
      .orderBy(subTasks.sortOrder);

    const sortOrder = maxOrder.length > 0 ? maxOrder[maxOrder.length - 1].sortOrder + 1 : 0;

    const [result] = await this.db
      .insert(subTasks)
      .values({ taskId: dto.taskId, text: dto.text, sortOrder })
      .returning();
    return result;
  }

  async update(userId: string, subTaskId: string, dto: UpdateSubTaskDto) {
    const subTask = await this.ensureSubTaskExists(subTaskId);
    await this.ensureTaskOwnership(userId, subTask.taskId);

    const [updated] = await this.db
      .update(subTasks)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(subTasks.id, subTaskId))
      .returning();
    return updated;
  }

  async toggle(userId: string, subTaskId: string) {
    const subTask = await this.ensureSubTaskExists(subTaskId);
    await this.ensureTaskOwnership(userId, subTask.taskId);

    const [updated] = await this.db
      .update(subTasks)
      .set({ isCompleted: !subTask.isCompleted, updatedAt: new Date() })
      .where(eq(subTasks.id, subTaskId))
      .returning();
    return updated;
  }

  async remove(userId: string, subTaskId: string) {
    const subTask = await this.ensureSubTaskExists(subTaskId);
    await this.ensureTaskOwnership(userId, subTask.taskId);

    await this.db.delete(subTasks).where(eq(subTasks.id, subTaskId));
    return { message: 'Sub-task deleted' };
  }

  async reorder(dto: ReorderSubTasksDto) {
    for (const item of dto.items) {
      await this.db
        .update(subTasks)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(eq(subTasks.id, item.id));
    }
    return { message: 'Reordered' };
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

  private async ensureSubTaskExists(subTaskId: string) {
    const [subTask] = await this.db
      .select()
      .from(subTasks)
      .where(eq(subTasks.id, subTaskId))
      .limit(1);
    if (!subTask) throw new NotFoundException('子任务不存在');
    return subTask;
  }
}
