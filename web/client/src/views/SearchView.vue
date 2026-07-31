<template>
  <div class="page">
    <NavBar title="搜索" />
    <van-search
      v-model="keyword"
      placeholder="搜索任务标题或描述..."
      @search="doSearch"
      @update:model-value="onInput"
      autofocus
    />
    <div class="content">
      <!-- 搜索历史 -->
      <div v-if="!didSearch && searchStore.history.length > 0" class="history-section">
        <div class="history-header">
          <span>最近搜索</span>
          <van-button size="small" type="danger" plain @click="searchStore.clearHistory()">清空</van-button>
        </div>
        <van-tag
          v-for="h in searchStore.history"
          :key="h.id"
          closeable mark plain type="primary" size="medium"
          @close="searchStore.deleteHistoryItem(h.id)"
          @click="keyword = h.keyword; doSearch()"
        >
          {{ h.keyword }}
        </van-tag>
      </div>
      <!-- 搜索结果 -->
      <div v-else-if="didSearch">
        <TaskCard
          v-for="task in searchStore.results"
          :key="task.id"
          :task="task"
          @toggle="handleToggle"
          @delete="handleDelete"
        />
        <EmptyState v-if="searchStore.results.length === 0" title="没有找到结果" :description="'未搜索到与「' + keyword + '」相关的任务'" />
      </div>
    </div>
    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSearchStore } from '@/stores/search.js';
import { useTaskStore } from '@/stores/task.js';
import NavBar from '@/components/NavBar.vue';
import TabBar from '@/components/TabBar.vue';
import TaskCard from '@/components/TaskCard.vue';
import EmptyState from '@/components/EmptyState.vue';

const searchStore = useSearchStore();
const taskStore = useTaskStore();
const keyword = ref('');
const didSearch = ref(false);
let debounceTimer: ReturnType<typeof setTimeout>;

onMounted(() => searchStore.fetchHistory());

function doSearch() {
  if (!keyword.value.trim()) return;
  didSearch.value = true;
  searchStore.search({ keyword: keyword.value });
}

function onInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (keyword.value.trim()) doSearch();
  }, 400);
}

function handleToggle(id: string) { taskStore.toggleTask(id); }
function handleDelete(id: string) { taskStore.deleteTask(id); }
</script>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 50px; }
.content { min-height: 60vh; }
.history-section { padding: 12px 16px; }
.history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.history-section .van-tag { margin: 4px 8px 4px 0; cursor: pointer; }
</style>
