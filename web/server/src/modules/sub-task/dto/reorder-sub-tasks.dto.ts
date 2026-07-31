import { Type } from 'class-transformer';
import { IsUUID, IsInt, IsArray, ValidateNested } from 'class-validator';

class ReorderItem {
  @IsUUID('4')
  id!: string;

  @IsInt()
  sortOrder!: number;
}

export class ReorderSubTasksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  items!: ReorderItem[];
}
