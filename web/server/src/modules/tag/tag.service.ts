import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE_DB } from '../../database/database.module.js';
import type { DbClient } from '../../config/database.config.js';
import { tags, taskTags } from '../../database/schema/index.js';
import type { CreateTagDto } from './dto/create-tag.dto.js';
import type { UpdateTagDto } from './dto/update-tag.dto.js';

@Injectable()
export class TagService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  async findAll(userId: string) {
    return this.db.select().from(tags).where(eq(tags.userId, userId)).orderBy(tags.createdAt);
  }

  async create(userId: string, dto: CreateTagDto) {
    const existing = await this.db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, userId), eq(tags.name, dto.name)))
      .limit(1);
    if (existing.length > 0) throw new ConflictException('Tag name already exists');

    const [tag] = await this.db
      .insert(tags)
      .values({ userId, name: dto.name, color: dto.color })
      .returning();
    return tag;
  }

  async update(userId: string, tagId: string, dto: UpdateTagDto) {
    const [tag] = await this.db
      .select()
      .from(tags)
      .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
      .limit(1);
    if (!tag) throw new NotFoundException('Tag not found');

    const [updated] = await this.db
      .update(tags)
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
      .returning();
    return updated;
  }

  async remove(userId: string, tagId: string) {
    const [tag] = await this.db
      .select()
      .from(tags)
      .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
      .limit(1);
    if (!tag) throw new NotFoundException('Tag not found');

    await this.db.delete(taskTags).where(eq(taskTags.tagId, tagId));
    await this.db.delete(tags).where(and(eq(tags.id, tagId), eq(tags.userId, userId)));
    return { message: 'Tag deleted' };
  }
}
