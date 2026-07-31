import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateSubTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  text?: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
