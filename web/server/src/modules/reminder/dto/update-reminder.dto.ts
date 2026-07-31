import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateReminderDto {
  @IsOptional()
  @IsString()
  remindAt?: string;

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
