<script setup lang="ts">
import { useRouter } from 'vue-router';

withDefaults(defineProps<{ title: string; showBack?: boolean }>(), { showBack: false });
const router = useRouter();

function handleBack() {
  router.back();
}
</script>

<template>
  <van-nav-bar
    :title="title"
    :left-text="showBack ? '返回' : ''"
    :left-arrow="showBack"
    @click-left="handleBack"
    fixed
    placeholder
  >
    <template #right>
      <slot name="right" />
    </template>
  </van-nav-bar>
</template>
