import { IsArray, IsUUID, IsString, IsOptional } from 'class-validator';

class BatchPayload {
  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsUUID()
  listId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}

export class BatchTaskDto {
  @IsString()
  action!: 'delete' | 'complete' | 'updatePriority' | 'moveToList' | 'updateTags';

  @IsArray()
  @IsUUID('4', { each: true })
  taskIds!: string[];

  @IsOptional()
  payload?: BatchPayload;
}
