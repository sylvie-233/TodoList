import { Controller, Get, Post, Patch, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { ListService } from './list.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtUser } from '../../common/decorators/current-user.decorator.js';
import { CreateListDto } from './dto/create-list.dto.js';
import { UpdateListDto } from './dto/update-list.dto.js';
import { ReorderListsDto } from './dto/reorder-lists.dto.js';

@Controller('lists')
export class ListController {
  constructor(private readonly listService: ListService) {}

  @Get()
  async findAll(@CurrentUser() user: JwtUser) {
    return this.listService.findAll(user.id);
  }

  @Post()
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateListDto) {
    return this.listService.create(user.id, dto);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.listService.findOne(user.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateListDto,
  ) {
    return this.listService.update(user.id, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.listService.remove(user.id, id);
  }

  @Patch('reorder')
  async reorder(@CurrentUser() user: JwtUser, @Body() dto: ReorderListsDto) {
    return this.listService.reorder(user.id, dto);
  }

  @Get(':id/stats')
  async stats(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.listService.getStats(user.id, id);
  }
}
