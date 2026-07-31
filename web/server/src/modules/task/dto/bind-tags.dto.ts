import { IsArray, IsUUID } from 'class-validator';

export class BindTagsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds!: string[];
}
