<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const active = ref('tasks');

watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/tasks')) active.value = 'tasks';
    else if (path.startsWith('/calendar')) active.value = 'calendar';
    else if (path.startsWith('/lists')) active.value = 'lists';
    else if (path.startsWith('/statistics')) active.value = 'statistics';
    else if (path.startsWith('/settings')) active.value = 'settings';
  },
  { immediate: true },
);
</script>

<template>
  <van-tabbar v-model="active" route fixed placeholder :safe-area-inset-bottom="true">
    <van-tabbar-item to="/tasks" icon="todo-list" name="tasks">任务</van-tabbar-item>
    <van-tabbar-item to="/calendar" icon="calendar-o" name="calendar">日历</van-tabbar-item>
    <van-tabbar-item to="/statistics" icon="chart-trending-o" name="statistics">统计</van-tabbar-item>
    <van-tabbar-item to="/settings" icon="setting-o" name="settings">设置</van-tabbar-item>
  </van-tabbar>
</template>
