<template>
  <div class="auth-page">
    <NavBar title="注册" />
    <van-form @submit="handleRegister" style="margin-top: 12px">
      <van-cell-group inset>
        <van-field
          v-model="form.username"
          label="用户名"
          placeholder="请输入用户名"
          :rules="[rules.required('用户名'), rules.minLength(2)]"
        />
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
          placeholder="至少6位"
          :rules="[rules.required('密码'), rules.minLength(6)]"
        />
        <van-field
          v-model="confirmPassword"
          label="确认密码"
          type="password"
          placeholder="再次输入密码"
          :rules="[rules.required('确认密码'), rules.passwordMatch(form.password)]"
        />
      </van-cell-group>
      <div style="margin: 16px">
        <van-button block type="primary" native-type="submit" :loading="loading">注 册</van-button>
      </div>
    </van-form>
    <div class="auth-switch">
      已有账号？<router-link to="/login">去登录</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { useAuthStore } from '@/stores/auth.js';
import { rules } from '@/utils/validation.js';
import NavBar from '@/components/NavBar.vue';

const authStore = useAuthStore();
const router = useRouter();
const loading = ref(false);

const form = reactive({ username: '', email: '', password: '' });
const confirmPassword = ref('');

async function handleRegister() {
  loading.value = true;
  try {
    await authStore.register(form);
    router.push('/tasks');
  } catch {
    showToast('注册失败，请重试');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page { min-height: 100vh; background: var(--color-bg); }
.auth-switch { text-align: center; margin-top: 24px; font-size: var(--font-size-sm); color: var(--color-text-secondary); }
</style>
