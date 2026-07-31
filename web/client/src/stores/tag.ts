import { defineStore } from 'pinia';
import { ref } from 'vue';
import { tagApi } from '@/api/index.js';
import type { Tag, CreateTagDto, UpdateTagDto } from '@todolist/shared';

export const useTagStore = defineStore('tag', () => {
  const tags = ref<Tag[]>([]);
  const loading = ref(false);

  async function fetchTags() {
    loading.value = true;
    try {
      tags.value = await tagApi.all();
    } finally {
      loading.value = false;
    }
  }

  async function createTag(dto: CreateTagDto) {
    const tag = await tagApi.create(dto);
    tags.value.push(tag);
    return tag;
  }

  async function updateTag(id: string, dto: UpdateTagDto) {
    const updated = await tagApi.update(id, dto);
    const idx = tags.value.findIndex((t) => t.id === id);
    if (idx >= 0) tags.value[idx] = updated;
    return updated;
  }

  async function deleteTag(id: string) {
    await tagApi.remove(id);
    tags.value = tags.value.filter((t) => t.id !== id);
  }

  return { tags, loading, fetchTags, createTag, updateTag, deleteTag };
});
