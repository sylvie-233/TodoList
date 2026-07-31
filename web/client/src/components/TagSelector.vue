<template>
  <div class="tag-selector">
    <div v-if="tags.length === 0" class="empty-tags">暂无标签，请先创建</div>
    <van-checkbox-group :model-value="modelValue" @update:model-value="onChange">
      <van-cell-group>
        <van-cell
          v-for="tag in tags"
          :key="tag.id"
          :title="tag.name"
          clickable
          @click="toggleTag(tag.id)"
        >
          <template #icon>
            <span class="tag-dot" :style="{ background: tag.color }" />
          </template>
          <template #right-icon>
            <van-checkbox :name="tag.id" />
          </template>
        </van-cell>
      </van-cell-group>
    </van-checkbox-group>
  </div>
</template>

<script setup lang="ts">
import type { Tag } from '@todolist/shared';

const props = defineProps<{
  tags: Pick<Tag, 'id' | 'name' | 'color'>[];
  modelValue: string[];
}>();

const emit = defineEmits<{
  'update:modelValue': [ids: string[]];
}>();

function toggleTag(tagId: string) {
  const idx = props.modelValue.indexOf(tagId);
  const next = [...props.modelValue];
  if (idx >= 0) next.splice(idx, 1);
  else next.push(tagId);
  emit('update:modelValue', next);
}

function onChange(val: string[]) {
  emit('update:modelValue', val);
}
</script>

<style scoped>
.tag-selector {
  padding: 12px 0;
}
.tag-dot {
  width: 12px; height: 12px; border-radius: 50%;
  margin-right: 10px; display: inline-block; vertical-align: middle;
}
.empty-tags {
  text-align: center;
  padding: 20px;
  color: var(--color-text-hint);
  font-size: var(--font-size-sm);
}
</style>
