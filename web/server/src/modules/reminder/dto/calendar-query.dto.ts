import { IsString } from 'class-validator';

export class CalendarQueryDto {
  @IsString()
  startDate!: string;

  @IsString()
  endDate!: string;
}
