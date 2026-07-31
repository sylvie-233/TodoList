import { get, patch } from '../request.js';
import type { User, UpdateUserDto, ChangePasswordDto } from '@todolist/shared';

export const userApi = {
  profile: () => get<User>('/users/me'),
  updateProfile: (dto: UpdateUserDto) => patch<User>('/users/me', dto),
  changePassword: (dto: ChangePasswordDto) => patch('/users/me/password', dto),
};
