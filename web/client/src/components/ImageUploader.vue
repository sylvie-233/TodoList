<script setup lang="ts">
import { ref } from 'vue';
import { showToast, showImagePreview } from 'vant';

const props = defineProps<{ images: { id?: string; url: string }[] }>();
const emit = defineEmits<{ add: [url: string]; delete: [id: string] }>();

const uploading = ref(false);

async function handleUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input?.files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/v1/files/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      body: formData,
    });
    const data = await res.json();
    if (data.data?.url) {
      emit('add', data.data.url);
      showToast('图片已上传');
    }
  } catch { showToast('上传失败'); }
  uploading.value = false;
  input.value = '';
}

function handlePreview(url: string) {
  showImagePreview({ images: [url.startsWith('http') ? url : window.location.origin + url] });
}

// delete 用 id，没有则用 url 作为标识
function delId(img: { id?: string; url: string }, idx: number) {
  return img.id || img.url || String(idx);
}
</script>

<template>
  <div class="img-grid">
    <div v-for="(img, idx) in images" :key="delId(img, idx)" class="img-cell" @click="handlePreview(img.url)">
      <img :src="img.url" alt="" />
      <span class="img-del" @click.stop="emit('delete', delId(img, idx))">×</span>
    </div>
    <label class="img-add" :class="{ loading: uploading }">
      <input type="file" accept="image/*" hidden @change="handleUpload" />
      <van-icon :name="uploading ? 'loading' : 'plus'" size="24" />
      <span>{{ uploading ? '...' : '添加图片' }}</span>
    </label>
  </div>
</template>

<style scoped>
.img-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.img-cell {
  width: 80px; height: 80px; border-radius: 6px; overflow: hidden;
  position: relative; cursor: pointer; background: var(--color-bg);
}
.img-cell img { width: 100%; height: 100%; object-fit: cover; }
.img-del {
  position: absolute; top: 0; right: 0;
  width: 20px; height: 20px; background: rgba(0,0,0,0.6); color: white;
  border-radius: 0 6px 0 6px; display: flex; align-items: center; justify-content: center;
  font-size: 14px; line-height: 1;
}
.img-add {
  width: 80px; height: 80px; border: 1px dashed var(--color-border);
  border-radius: 6px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 4px;
  color: var(--color-text-hint); font-size: 11px; cursor: pointer;
  background: var(--color-bg);
}
.img-add.loading { opacity: 0.5; pointer-events: none; }
</style>
