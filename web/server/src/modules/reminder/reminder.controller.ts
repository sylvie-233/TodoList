import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseUUIDPipe } from '@nestjs/common';
import { ReminderService } from './reminder.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtUser } from '../../common/decorators/current-user.decorator.js';
import { CreateReminderDto } from './dto/create-reminder.dto.js';
import { UpdateReminderDto } from './dto/update-reminder.dto.js';
import { CalendarQueryDto } from './dto/calendar-query.dto.js';

@Controller('reminders')
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @Post()
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateReminderDto) {
    return this.reminderService.create(user.id, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReminderDto,
  ) {
    return this.reminderService.update(user.id, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.reminderService.remove(user.id, id);
  }

  @Get('upcoming')
  async upcoming(@CurrentUser() user: JwtUser, @Query('page') page?: number) {
    return this.reminderService.getUpcoming(user.id, page ?? 1);
  }

  @Get('calendar')
  async calendar(@CurrentUser() user: JwtUser, @Query() query: CalendarQueryDto) {
    return this.reminderService.getCalendarRange(user.id, query);
  }
}
