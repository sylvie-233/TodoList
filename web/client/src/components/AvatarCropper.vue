<script setup lang="ts">
import { ref } from 'vue';
import { Cropper } from 'vue-advanced-cropper';
import { showToast } from 'vant';
import 'vue-advanced-cropper/dist/style.css';
import { userApi } from '@/api/index.js';

const emit = defineEmits<{ done: [url: string] }>();
const show = ref(false);
const src = ref('');
const cropper = ref<InstanceType<typeof Cropper> | null>(null);
const uploading = ref(false);

function open() { show.value = true; }

function handleSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { src.value = reader.result as string; };
  reader.readAsDataURL(file);
}

async function handleCrop() {
  const canvas = cropper.value?.getResult()?.canvas;
  if (!canvas) return;
  uploading.value = true;
  try {
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85));
    const formData = new FormData();
    formData.append('file', blob, 'avatar.jpg');
    const res = await fetch('/api/v1/files/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      body: formData,
    });
    const data = await res.json();
    if (data.data?.url) {
      await userApi.updateProfile({ avatarUrl: data.data.url });
      emit('done', data.data.url);
      showToast('头像已更新');
      show.value = false;
    }
  } catch { showToast('上传失败'); }
  uploading.value = false;
}

defineExpose({ open });
</script>

<template>
  <van-dialog v-model:show="show" title="裁剪头像" :show-cancel-button="false" @closed="src = ''">
    <div class="cropper-wrapper" v-if="src">
      <Cropper ref="cropper" :src="src" :stencil-props="{ aspectRatio: 1 }" />
    </div>
    <div class="crop-actions" v-if="!src">
      <label class="crop-btn">
        <input type="file" accept="image/*" hidden @change="handleSelect" />
        <van-icon name="photograph" size="20" />
        <span>选择图片</span>
      </label>
    </div>
    <div class="crop-actions" v-else>
      <van-button size="small" plain @click="src = ''">重选</van-button>
      <van-button size="small" type="primary" :loading="uploading" @click="handleCrop">确认裁剪</van-button>
    </div>
  </van-dialog>
</template>

<style scoped>
.cropper-wrapper { height: 260px; background: #000; }
.crop-actions { display: flex; gap: 12px; justify-content: center; padding: 12px; }
.crop-btn {
  display: flex; align-items: center; gap: 6px; padding: 12px 24px;
  border: 1px dashed var(--color-border); border-radius: 8px;
  color: var(--color-text-secondary); cursor: pointer;
}
</style>
