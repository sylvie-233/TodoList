import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/api/index.js';
import type { User, LoginDto, RegisterDto } from '@todolist/shared';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'));
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'));

  const isAuthenticated = computed(() => !!accessToken.value);

  function saveTokens(access: string, refresh: string) {
    accessToken.value = access;
    refreshToken.value = refresh;
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  }

  function clearTokens() {
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async function login(dto: LoginDto) {
    const res = await authApi.login(dto);
    user.value = res.user;
    saveTokens(res.tokens.accessToken, res.tokens.refreshToken);
  }

  async function register(dto: RegisterDto) {
    const res = await authApi.register(dto);
    user.value = res.user;
    saveTokens(res.tokens.accessToken, res.tokens.refreshToken);
  }

  async function logout() {
    clearTokens();
    window.location.href = '/login';
  }

  return { user, accessToken, refreshToken, isAuthenticated, login, register, logout, clearTokens, saveTokens };
});
