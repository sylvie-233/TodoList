import { Controller, Post, Patch, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { SubTaskService } from './sub-task.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtUser } from '../../common/decorators/current-user.decorator.js';
import { CreateSubTaskDto } from './dto/create-sub-task.dto.js';
import { UpdateSubTaskDto } from './dto/update-sub-task.dto.js';
import { ReorderSubTasksDto } from './dto/reorder-sub-tasks.dto.js';

@Controller('sub-tasks')
export class SubTaskController {
  constructor(private readonly subTaskService: SubTaskService) {}

  @Post()
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateSubTaskDto) {
    return this.subTaskService.create(user.id, dto);
  }

  // ⚠️ 固定路由（reorder, toggle）必须在 :id 动态路由之前注册
  @Patch('reorder')
  async reorder(@CurrentUser() _user: JwtUser, @Body() dto: ReorderSubTasksDto) {
    return this.subTaskService.reorder(dto);
  }

  @Patch(':id/toggle')
  async toggle(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.subTaskService.toggle(user.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubTaskDto,
  ) {
    return this.subTaskService.update(user.id, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.subTaskService.remove(user.id, id);
  }
}
