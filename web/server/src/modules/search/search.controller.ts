import { Controller, Get, Delete, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { SearchService } from './search.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtUser } from '../../common/decorators/current-user.decorator.js';
import { SearchQueryDto } from './dto/search-query.dto.js';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@CurrentUser() user: JwtUser, @Query() query: SearchQueryDto) {
    return this.searchService.search(user.id, query);
  }

  @Get('history')
  async getHistory(@CurrentUser() user: JwtUser) {
    return this.searchService.getHistory(user.id);
  }

  @Delete('history')
  async clearHistory(@CurrentUser() user: JwtUser) {
    return this.searchService.clearHistory(user.id);
  }

  @Delete('history/:id')
  async deleteHistoryItem(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.searchService.deleteHistoryItem(user.id, id);
  }
}
