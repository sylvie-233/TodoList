<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { showToast } from 'vant';
import { useListStore } from '@/stores/list.js';
import { useTaskStore } from '@/stores/task.js';
import NavBar from '@/components/NavBar.vue';
import TaskCard from '@/components/TaskCard.vue';
import EmptyState from '@/components/EmptyState.vue';

const route = useRoute();
const listStore = useListStore();
const taskStore = useTaskStore();

onMounted(() => {
  const id = route.params.id as string;
  listStore.fetchListById(id);
  taskStore.fetchTasks({ listId: id });
});

function handleToggle(id: string) { taskStore.toggleTask(id); showToast('状态已更新'); }
function handleDelete(id: string) { taskStore.deleteTask(id); showToast('已移入回收站'); }
</script>

<template>
  <div class="page">
    <NavBar :title="listStore.currentList?.name ?? '清单'" show-back />
    <div class="content">
      <TaskCard
        v-for="task in taskStore.tasks"
        :key="task.id"
        :task="task"
        @toggle="handleToggle"
        @delete="handleDelete"
      />
      <EmptyState v-if="taskStore.tasks.length === 0" title="该清单暂无任务" />
    </div>
    
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 50px; }
.content { min-height: 60vh; }
</style>
