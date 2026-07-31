import { IsString, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CreateSubTaskDto {
  @IsUUID()
  taskId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text!: string;
}
