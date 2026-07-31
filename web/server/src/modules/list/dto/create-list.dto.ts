import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateListDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}
