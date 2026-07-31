<template>
  <div class="page">
    <NavBar title="编辑任务" />
    <TaskForm
      v-if="taskStore.currentTask"
      :is-edit="true"
      :task="taskStore.currentTask"
      :loading="saving"
      @submit="handleSave"
    />
    <div style="padding: 16px">
      <van-button block type="danger" @click="handleDelete" plain>删除任务</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showConfirmDialog } from 'vant';
import { useTaskStore } from '@/stores/task.js';
import NavBar from '@/components/NavBar.vue';
import TaskForm from '@/components/TaskForm.vue';
import type { UpdateTaskDto } from '@todolist/shared';

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const saving = ref(false);

onMounted(() => {
  const id = route.params.id as string;
  taskStore.fetchTaskById(id);
});

async function handleSave(dto: UpdateTaskDto) {
  saving.value = true;
  try {
    await taskStore.updateTask(route.params.id as string, dto);
    router.back();
  } finally { saving.value = false; }
}

async function handleDelete() {
  await showConfirmDialog({
    title: '删除任务',
    message: '确定要移到回收站吗？',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  });
  await taskStore.deleteTask(route.params.id as string);
  router.back();
}
</script>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 50px; }
</style>
