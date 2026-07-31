import { IsUUID, IsOptional } from 'class-validator';

export class MoveTaskDto {
  @IsOptional()
  @IsUUID()
  targetListId!: string | null;
}
