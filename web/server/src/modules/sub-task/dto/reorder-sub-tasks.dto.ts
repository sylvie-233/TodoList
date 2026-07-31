import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsUUID, IsInt } from 'class-validator';

class ReorderItem {
  @IsUUID()
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
