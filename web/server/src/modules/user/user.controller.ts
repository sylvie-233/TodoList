import { Controller, Get, Patch, Body } from '@nestjs/common';
import { UserService } from './user.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtUser } from '../../common/decorators/current-user.decorator.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: JwtUser) {
    return this.userService.getProfile(user.id);
  }

  @Patch('me')
  async updateProfile(@CurrentUser() user: JwtUser, @Body() dto: UpdateUserDto) {
    return this.userService.updateProfile(user.id, dto);
  }

  @Patch('me/password')
  async changePassword(@CurrentUser() user: JwtUser, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(user.id, dto);
  }
}
