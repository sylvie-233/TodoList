import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DRIZZLE_DB } from '../../database/database.module.js';
import type { DbClient } from '../../config/database.config.js';
import { users } from '../../database/schema/index.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import type { ChangePasswordDto } from './dto/change-password.dto.js';

@Injectable()
export class UserService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  async getProfile(userId: string) {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const [updated] = await this.db
      .update(users)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!updated) throw new NotFoundException('User not found');
    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Old password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { message: 'Password changed successfully' };
  }
}
