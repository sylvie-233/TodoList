import { IsOptional, IsString, IsUUID, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class TaskFilterDto {
  @IsOptional()
  @IsUUID()
  listId?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  status?: 'all' | 'active' | 'completed';

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'sortOrder';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPinned?: boolean;
}
