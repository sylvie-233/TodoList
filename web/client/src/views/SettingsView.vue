<template>
  <div class="page">
    <NavBar title="设置" />
    <div class="content">
      <van-cell-group inset title="个人信息">
        <van-cell title="用户名" :value="authStore.user?.username ?? '-'" />
        <van-cell title="邮箱" :value="authStore.user?.email ?? '-'" />
      </van-cell-group>
      <div style="margin: 16px">
        <van-button block plain type="primary" @click="showPassword = true">修改密码</van-button>
      </div>
      <div style="margin: 16px">
        <van-button block round type="danger" @click="handleLogout">退出登录</van-button>
      </div>
      <div class="version-info">
        <p>TodoList v0.0.1</p>
      </div>
    </div>
    <!-- 修改密码弹窗 -->
    <van-dialog
      v-model:show="showPassword"
      title="修改密码"
      show-cancel-button
      @confirm="handleChangePassword"
    >
      <van-field v-model="oldPwd" type="password" label="旧密码" placeholder="输入当前密码" />
      <van-field v-model="newPwd" type="password" label="新密码" placeholder="至少6位" />
    </van-dialog>
    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { showToast } from 'vant';
import { useAuthStore } from '@/stores/auth.js';
import { userApi } from '@/api/index.js';
import NavBar from '@/components/NavBar.vue';
import TabBar from '@/components/TabBar.vue';

const authStore = useAuthStore();
const showPassword = ref(false);
const oldPwd = ref('');
const newPwd = ref('');

onMounted(async () => {
  if (!authStore.user) {
    try {
      authStore.user = await userApi.profile();
    } catch { /* 忽略 */ }
  }
});

async function handleChangePassword() {
  if (!oldPwd.value || !newPwd.value) {
    showToast('请填写完整');
    return;
  }
  try {
    await userApi.changePassword({ oldPassword: oldPwd.value, newPassword: newPwd.value });
    showToast('密码修改成功');
    oldPwd.value = '';
    newPwd.value = '';
  } catch {
    showToast('修改失败，请检查旧密码是否正确');
  }
}

function handleLogout() {
  authStore.logout();
}
</script>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 50px; }
.content { padding-top: 12px; }
.version-info { text-align: center; padding: 24px; color: var(--color-text-hint); font-size: var(--font-size-xs); }
</style>
