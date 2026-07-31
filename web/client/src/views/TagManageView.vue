<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { showConfirmDialog, showToast } from 'vant';
import { useTagStore } from '@/stores/tag.js';
import type { Tag } from '@todolist/shared';
import NavBar from '@/components/NavBar.vue';
import EmptyState from '@/components/EmptyState.vue';

const tagStore = useTagStore();
const showCreate = ref(false);
const tagName = ref('');
const tagColor = ref('#a855f7');
const editingTag = ref<Tag | null>(null);

const presetColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#78716c'];

onMounted(() => tagStore.fetchTags());

async function handleSave() {
  if (!tagName.value.trim()) return;
  if (editingTag.value) {
    await tagStore.updateTag(editingTag.value.id, { name: tagName.value.trim(), color: tagColor.value });
  } else {
    await tagStore.createTag({ name: tagName.value.trim(), color: tagColor.value });
  }
  await new Promise((r) => setTimeout(r, 300));
  showToast(editingTag.value ? '标签已更新' : '标签已创建');
  tagName.value = '';
  tagColor.value = '#a855f7';
  editingTag.value = null;
}

function handleEdit(tag: Tag) {
  editingTag.value = tag;
  tagName.value = tag.name;
  tagColor.value = tag.color;
  showCreate.value = true;
}

async function handleDelete(id: string) {
  await showConfirmDialog({
    title: '删除标签',
    message: '所有任务上的此标签将被移除',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  });
  await tagStore.deleteTag(id);
  showToast('标签已删除');
}
</script>

<template>
  <div class="page">
    <NavBar title="标签管理" show-back />
    <div class="content">
      <div class="tag-grid">
        <div
          v-for="tag in tagStore.tags"
          :key="tag.id"
          class="tag-card"
          :style="{ borderColor: tag.color }"
        >
          <span class="tag-dot" :style="{ background: tag.color }" />
          <span class="tag-name">{{ tag.name }}</span>
          <van-icon name="edit" size="16" color="#999" @click="handleEdit(tag)" />
          <van-icon name="cross" size="16" color="#999" @click="handleDelete(tag.id)" />
        </div>
      </div>
      <div style="margin: 16px">
        <van-button block plain type="primary" icon="plus" @click="showCreate = true">新建标签</van-button>
      </div>
      <EmptyState v-if="tagStore.tags.length === 0" title="暂无标签" description="创建标签分类管理任务" />
    </div>
    <van-dialog
      v-model:show="showCreate"
      :title="editingTag ? '编辑标签' : '新建标签'"
      show-cancel-button
      @confirm="handleSave"
    >
      <van-field v-model="tagName" placeholder="标签名称" />
      <div class="color-row">
        <span
          v-for="c in presetColors"
          :key="c"
          class="color-dot"
          :class="{ active: tagColor === c }"
          :style="{ background: c }"
          @click="tagColor = c"
        />
      </div>
    </van-dialog>
    
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 50px; }
.content { padding: 12px; }
.tag-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.tag-card {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: var(--radius-round);
  border: 1px solid; background: var(--color-bg-card);
  font-size: var(--font-size-sm);
}
.tag-dot { width: 10px; height: 10px; border-radius: 50%; }
.tag-name { font-weight: 500; min-width: 20px; }
.color-row { display: flex; gap: 10px; padding: 12px 16px; justify-content: center; }
.color-dot { display: inline-block; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; border: 3px solid transparent; transition: transform 0.2s; vertical-align: middle; }
.color-dot.active { border-color: var(--color-text); transform: scale(1.15); }
</style>
