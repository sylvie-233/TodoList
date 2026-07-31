import { Controller, Get, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtUser } from '../../common/decorators/current-user.decorator.js';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  async dashboard(@CurrentUser() user: JwtUser) {
    return this.statisticsService.getDashboard(user.id);
  }

  @Get('trends')
  async trends(@CurrentUser() user: JwtUser, @Query('days') days?: number) {
    return this.statisticsService.getTrends(user.id, days ?? 7);
  }

  @Get('overdue')
  async overdue(@CurrentUser() user: JwtUser) {
    return this.statisticsService.getOverdue(user.id);
  }
}
