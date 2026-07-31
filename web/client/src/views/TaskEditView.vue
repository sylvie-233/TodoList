<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import { useTaskStore } from '@/stores/task.js';
import { taskApi } from '@/api/index.js';
import NavBar from '@/components/NavBar.vue';
import TaskForm from '@/components/TaskForm.vue';
import ImageUploader from '@/components/ImageUploader.vue';
import type { UpdateTaskDto } from '@todolist/shared';

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const saving = ref(false);
const taskImages = ref<{ id: string; url: string }[]>([]);

onMounted(async () => {
  const id = route.params.id as string;
  taskStore.fetchTaskById(id);
  try { taskImages.value = await taskApi.images(id); } catch { /* ignore */ }
});

async function handleAddImage(url: string) {
  const img = await taskApi.addImage(route.params.id as string, url);
  taskImages.value.push(img);
}
async function handleDeleteImage(imageId: string) {
  await taskApi.deleteImage(route.params.id as string, imageId);
  taskImages.value = taskImages.value.filter((img) => img.id !== imageId);
  showToast('图片已删除');
}

async function handleSave(dto: UpdateTaskDto) {
  saving.value = true;
  try {
    await taskStore.updateTask(route.params.id as string, dto);
    showToast('任务已保存');
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
  showToast('已移入回收站');
  router.back();
}
</script>

<template>
  <div class="page">
    <NavBar title="编辑任务" show-back />
    <TaskForm
      v-if="taskStore.currentTask"
      :is-edit="true"
      :task="taskStore.currentTask"
      :loading="saving"
      @submit="handleSave"
    />
    <div class="img-section">
      <h3>图片</h3>
      <ImageUploader :images="taskImages" @add="handleAddImage" @delete="handleDeleteImage" />
    </div>
    <div style="padding: 16px">
      <van-button block type="danger" @click="handleDelete" plain>删除任务</van-button>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 50px; }
.img-section { background: var(--color-bg-card); padding: 12px 16px; margin-top: 12px; }
.img-section h3 { font-size: var(--font-size-md); font-weight: 600; margin-bottom: 8px; }
</style>
