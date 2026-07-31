import { Controller, Get, Post, Patch, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { TagService } from './tag.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtUser } from '../../common/decorators/current-user.decorator.js';
import { CreateTagDto } from './dto/create-tag.dto.js';
import { UpdateTagDto } from './dto/update-tag.dto.js';

@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  async findAll(@CurrentUser() user: JwtUser) {
    return this.tagService.findAll(user.id);
  }

  @Post()
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateTagDto) {
    return this.tagService.create(user.id, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTagDto,
  ) {
    return this.tagService.update(user.id, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.tagService.remove(user.id, id);
  }
}
