<template>
  <div class="auth-page">
    <div class="auth-header">
      <h1 class="app-logo">📋 TodoList</h1>
      <p class="app-slogan">高效管理你的每一天</p>
    </div>
    <van-form @submit="handleLogin">
      <van-cell-group inset>
        <van-field
          v-model="form.email"
          label="邮箱"
          placeholder="请输入邮箱"
          :rules="[rules.required('邮箱'), rules.email]"
        />
        <van-field
          v-model="form.password"
          label="密码"
          type="password"
          placeholder="请输入密码"
          :rules="[rules.required('密码')]"
        />
      </van-cell-group>
      <div style="margin: 16px">
        <van-button block type="primary" native-type="submit" :loading="loading">登 录</van-button>
      </div>
    </van-form>
    <div class="auth-switch">
      还没有账号？<router-link to="/register">立即注册</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { useAuthStore } from '@/stores/auth.js';
import { rules } from '@/utils/validation.js';

const authStore = useAuthStore();
const router = useRouter();
const loading = ref(false);

const form = reactive({ email: '', password: '' });

async function handleLogin() {
  loading.value = true;
  try {
    await authStore.login(form);
    router.push('/tasks');
  } catch {
    showToast('登录失败，请检查邮箱和密码');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page { min-height: 100vh; background: var(--color-bg); padding-top: 60px; }
.auth-header { text-align: center; margin-bottom: 40px; }
.app-logo { font-size: 32px; color: var(--color-primary); }
.app-slogan { color: var(--color-text-secondary); margin-top: 8px; }
.auth-switch { text-align: center; margin-top: 24px; font-size: var(--font-size-sm); color: var(--color-text-secondary); }
</style>
