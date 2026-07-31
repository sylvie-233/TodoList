<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import { useAuthStore } from '@/stores/auth.js';
import { userApi } from '@/api/index.js';
import NavBar from '@/components/NavBar.vue';
import AvatarCropper from '@/components/AvatarCropper.vue';

const router = useRouter();
const authStore = useAuthStore();
const showPassword = ref(false);
const oldPwd = ref('');
const newPwd = ref('');
const cropper = ref<InstanceType<typeof AvatarCropper> | null>(null);

onMounted(async () => {
  if (!authStore.user) {
    try { authStore.user = await userApi.profile(); } catch { /* ignore */ }
  }
});

async function handleChangePassword() {
  if (!oldPwd.value || !newPwd.value) { showToast('请填写完整'); return; }
  try {
    await userApi.changePassword({ oldPassword: oldPwd.value, newPassword: newPwd.value });
    showToast('密码修改成功');
    oldPwd.value = ''; newPwd.value = '';
  } catch { showToast('修改失败，请检查旧密码是否正确'); }
}

async function handleLogout() {
  try {
    await showConfirmDialog({
      title: '退出登录',
      message: '确定要退出当前账号吗？',
      confirmButtonText: '退出',
      cancelButtonText: '取消',
    });
    showToast('已退出登录');
    authStore.logout();
  } catch { /* 用户取消 */ }
}

const featureLinks = [
  { title: '清单管理', icon: 'bars', to: '/lists' },
  { title: '标签管理', icon: 'label-o', to: '/tags' },
  { title: '回收站', icon: 'delete-o', to: '/recycle-bin' },
];
</script>

<template>
  <div class="page">
    <NavBar title="设置" />
    <div class="content">
      <van-cell-group inset title="个人信息">
        <van-cell title="用户名" :value="authStore.user?.username ?? '-'" />
        <van-cell title="邮箱" :value="authStore.user?.email ?? '-'" />
        <van-cell title="头像" is-link @click="cropper?.open()">
          <template #value>
            <img
              :src="authStore.user?.avatarUrl ?? ''"
              class="avatar-preview"
              :class="{ empty: !authStore.user?.avatarUrl }"
              alt=""
            />
          </template>
        </van-cell>
      </van-cell-group>

      <div style="margin: 16px">
        <van-button block plain type="primary" @click="showPassword = true">修改密码</van-button>
      </div>

      <van-cell-group inset title="功能">
        <van-cell
          v-for="item in featureLinks"
          :key="item.to"
          :title="item.title"
          :icon="item.icon"
          is-link
          @click="router.push(item.to)"
        />
      </van-cell-group>

      <div style="margin: 24px 16px">
        <van-button block round type="danger" @click="handleLogout">退出登录</van-button>
      </div>

      <div class="version-info"><p>TodoList v0.0.1</p></div>
    </div>

    <van-dialog v-model:show="showPassword" title="修改密码" show-cancel-button @confirm="handleChangePassword">
      <van-field v-model="oldPwd" type="password" label="旧密码" placeholder="输入当前密码" />
      <van-field v-model="newPwd" type="password" label="新密码" placeholder="至少6位" />
    </van-dialog>

    <AvatarCropper ref="cropper" @done="(url) => { if (authStore.user) authStore.user.avatarUrl = url; }" />
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 50px; }
.content { padding-top: 12px; }
.version-info { text-align: center; padding: 24px; color: var(--color-text-hint); font-size: var(--font-size-xs); }
.avatar-preview { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.avatar-preview.empty { background: var(--color-bg); border: 1px dashed var(--color-border); }
</style>
