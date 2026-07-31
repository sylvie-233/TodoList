<template>
  <van-nav-bar :title="title" left-text="返回" left-arrow @click-left="handleBack" fixed placeholder>
    <template #right>
      <slot name="right" />
    </template>
  </van-nav-bar>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

defineProps<{ title: string }>();
const router = useRouter();

function handleBack() {
  router.back();
}
</script>
