<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { Priority } from '@todolist/shared';
import { useTagStore } from '@/stores/tag.js';

const tagStore = useTagStore();

const visible = defineModel<boolean>('visible', { default: false });

const emit = defineEmits<{
  apply: [filter: Record<string, unknown>];
}>();

const filter = reactive<{
  status?: string;
  priority?: string;
  tagId?: string;
}>({ status: 'all' });

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '未完成', value: 'active' },
  { label: '已完成', value: 'completed' },
];

const priorityOptions = [
  { label: '紧急', value: Priority.URGENT },
  { label: '高', value: Priority.HIGH },
  { label: '中', value: Priority.MEDIUM },
  { label: '低', value: Priority.LOW },
];

function handleReset() {
  filter.status = 'all';
  filter.priority = undefined;
  filter.tagId = undefined;
}

function handleApply() {
  const f: Record<string, unknown> = {};
  if (filter.status && filter.status !== 'all') f.status = filter.status;
  if (filter.priority) f.priority = filter.priority;
  if (filter.tagId) f.tagId = filter.tagId;
  emit('apply', f);
  visible.value = false;
}

onMounted(() => tagStore.fetchTags());
</script>

<template>
  <van-action-sheet
    v-model:show="visible"
    title="筛选条件"
    :close-on-click-action="false"
  >
    <div class="filter-body">
      <!-- 状态 -->
      <div class="filter-group">
        <div class="filter-label">状态</div>
        <div class="filter-options">
          <van-tag
            v-for="opt in statusOptions"
            :key="opt.value"
            :type="filter.status === opt.value ? 'primary' : 'default'"
            size="large"
            @click="filter.status = opt.value"
          >
            {{ opt.label }}
          </van-tag>
        </div>
      </div>

      <!-- 优先级 -->
      <div class="filter-group">
        <div class="filter-label">优先级</div>
        <div class="filter-options">
          <van-tag
            v-for="opt in priorityOptions"
            :key="opt.value"
            :type="filter.priority === opt.value ? 'primary' : 'default'"
            size="large"
            @click="filter.priority = filter.priority === opt.value ? undefined : opt.value"
          >
            {{ opt.label }}
          </van-tag>
        </div>
      </div>

      <!-- 标签 -->
      <div class="filter-group">
        <div class="filter-label">标签</div>
        <div class="filter-options tag-scroll">
          <van-tag
            v-for="t in tagStore.tags"
            :key="t.id"
            :type="filter.tagId === t.id ? 'primary' : 'default'"
            size="medium"
            @click="filter.tagId = filter.tagId === t.id ? undefined : t.id"
          >
            {{ t.name }}
          </van-tag>
          <span v-if="tagStore.tags.length === 0" class="no-data">暂无标签</span>
        </div>
      </div>

      <!-- 按钮 -->
      <div class="filter-actions">
        <van-button size="small" plain @click="handleReset">重置</van-button>
        <van-button size="small" type="primary" @click="handleApply">应用</van-button>
      </div>
    </div>
  </van-action-sheet>
</template>

<style scoped>
.filter-body { padding: 0 16px 24px; max-height: 60vh; overflow-y: auto; }
.filter-group { margin-top: 16px; }
.filter-label { font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-bottom: 8px; }
.filter-options { display: flex; flex-wrap: wrap; gap: 8px; }
.filter-options .van-tag { cursor: pointer; }
.tag-scroll { max-height: 120px; overflow-y: auto; padding: 2px; }
.no-data { font-size: var(--font-size-xs); color: var(--color-text-hint); }
.filter-actions { display: flex; gap: 12px; margin-top: 20px; }
.filter-actions .van-button { flex: 1; }
</style>
