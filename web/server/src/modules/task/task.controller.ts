import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TaskService } from './task.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtUser } from '../../common/decorators/current-user.decorator.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TaskFilterDto } from './dto/task-filter.dto.js';
import { BatchTaskDto } from './dto/batch-task.dto.js';
import { MoveTaskDto } from './dto/move-task.dto.js';
import { BindTagsDto } from './dto/bind-tags.dto.js';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  async findAll(@CurrentUser() user: JwtUser, @Query() filter: TaskFilterDto) {
    return this.taskService.findAll(user.id, filter);
  }

  @Get('today')
  async today(@CurrentUser() user: JwtUser) {
    return this.taskService.getToday(user.id);
  }

  @Get('planned')
  async planned(@CurrentUser() user: JwtUser, @Query('page') page?: number) {
    return this.taskService.getPlanned(user.id, page ?? 1);
  }

  @Get('completed')
  async completed(@CurrentUser() user: JwtUser, @Query('page') page?: number) {
    return this.taskService.getCompleted(user.id, page ?? 1);
  }

  @Get('recycle-bin')
  async recycleBin(@CurrentUser() user: JwtUser, @Query('page') page?: number) {
    return this.taskService.getRecycleBin(user.id, page ?? 1);
  }

  @Post()
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateTaskDto) {
    return this.taskService.create(user.id, dto);
  }

  @Post('batch')
  async batch(@CurrentUser() user: JwtUser, @Body() dto: BatchTaskDto) {
    return this.taskService.batch(user.id, dto);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.taskService.findOne(user.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.update(user.id, id, dto);
  }

  @Patch(':id/toggle')
  async toggle(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.taskService.toggle(user.id, id);
  }

  @Post(':id/move')
  async move(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveTaskDto,
  ) {
    return this.taskService.move(user.id, id, dto);
  }

  @Post(':id/copy')
  async copy(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.taskService.copy(user.id, id);
  }

  @Delete(':id')
  async softDelete(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.taskService.softDelete(user.id, id);
  }

  @Patch(':id/restore')
  async restore(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.taskService.restore(user.id, id);
  }

  @Delete(':id/permanent')
  async permanentDelete(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.taskService.permanentDelete(user.id, id);
  }

  @Post(':id/tags')
  async bindTags(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BindTagsDto,
  ) {
    return this.taskService.bindTags(user.id, id, dto);
  }

  @Get(':id/sub-tasks')
  async getSubTasks(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.taskService.getSubTasks(user.id, id);
  }
}
