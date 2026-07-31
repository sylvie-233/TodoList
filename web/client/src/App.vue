<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TabBar from '@/components/TabBar.vue';

const route = useRoute();
const router = useRouter();

const transitionName = ref('slide-left');

// TabBar 页面顺序，用于判断左右滑动方向
const tabOrder: Record<string, number> = {
  Tasks: 0, Today: 0, Planned: 0, Completed: 0, TaskDetail: 0, RecycleBin: 0,
  Calendar: 1,
  Statistics: 2,
  Settings: 3,
};

const showTabBar = computed(() => {
  const n = route.name as string;
  return n !== 'Login' && n !== 'Register' && n !== 'TaskEdit';
});

// 监听路由变化，根据 tab 顺序决定动画方向
router.beforeEach((to, from) => {
  const toIdx = tabOrder[to.name as string] ?? -1;
  const fromIdx = tabOrder[from.name as string] ?? -1;

  if (toIdx >= 0 && fromIdx >= 0) {
    // 两个都是 TabBar 页 → 按索引大小决定方向
    transitionName.value = toIdx > fromIdx ? 'slide-left' : 'slide-right';
  } else if (to.name === 'TaskEdit' || toIdx >= 0) {
    // 进入子页或 tab 页 → 向左滑
    transitionName.value = 'slide-left';
  } else {
    // 返回 → 向右滑
    transitionName.value = 'slide-right';
  }
});
</script>

<template>
  <router-view v-slot="{ Component, route: r }">
    <transition :name="transitionName" mode="out-in">
      <component :is="Component" :key="r.path" />
    </transition>
  </router-view>
  <TabBar v-if="showTabBar" />
</template>

<style>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 向左滑：新页面从右进入 */
.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0.6;
}
.slide-left-leave-to {
  transform: translateX(-20%);
  opacity: 0;
}

/* 向右滑：新页面从左进入 */
.slide-right-enter-from {
  transform: translateX(-20%);
  opacity: 0.6;
}
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
