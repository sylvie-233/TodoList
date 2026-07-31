import { post } from '../request.js';
import type { AuthResponse, LoginDto, RegisterDto, TokenPair } from '@todolist/shared';

export const authApi = {
  login: (dto: LoginDto) => post<AuthResponse>('/auth/login', dto),
  register: (dto: RegisterDto) => post<AuthResponse>('/auth/register', dto),
  refresh: (refreshToken: string) => post<TokenPair>('/auth/refresh', { refreshToken }),
};
