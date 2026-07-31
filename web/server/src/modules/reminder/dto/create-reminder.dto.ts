import { IsString, IsUUID, IsBoolean, IsOptional } from 'class-validator';

export class CreateReminderDto {
  @IsUUID()
  taskId!: string;

  @IsString()
  remindAt!: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsString()
  recurType?: string;

  @IsOptional()
  @IsString()
  recurRule?: string;
}
