<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { showConfirmDialog, showToast } from 'vant';
import { useListStore } from '@/stores/list.js';
import NavBar from '@/components/NavBar.vue';
import EmptyState from '@/components/EmptyState.vue';

const listStore = useListStore();
const showCreate = ref(false);
const newName = ref('');

onMounted(() => listStore.fetchLists());

async function handleCreate() {
  if (!newName.value.trim()) return;
  await listStore.createList({ name: newName.value.trim() });
  await new Promise((r) => setTimeout(r, 300));
  showToast('清单已创建');
  newName.value = '';
}

async function handleDelete(id: string) {
  await showConfirmDialog({
    title: '删除清单',
    message: '清单下的任务不会被删除，仅取消关联',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  });
  await listStore.deleteList(id);
  await new Promise((r) => setTimeout(r, 300));
  showToast('清单已删除');
}
</script>

<template>
  <div class="page">
    <NavBar title="清单管理" show-back />
    <div class="content">
      <van-cell-group inset v-if="listStore.lists.length">
        <van-swipe-cell v-for="list in listStore.lists" :key="list.id">
          <van-cell :title="list.name" is-link @click="$router.push(`/lists/${list.id}`)">
            <template #icon>
              <div class="list-icon" :style="{ background: list.color }">📋</div>
            </template>
          </van-cell>
          <template #right>
            <van-button v-if="!list.isBuiltin" square type="danger" text="删除" @click="handleDelete(list.id)" />
          </template>
        </van-swipe-cell>
      </van-cell-group>
      <div style="margin: 16px">
        <van-button block plain type="primary" icon="plus" @click="showCreate = true">新建清单</van-button>
      </div>
      <EmptyState v-if="!listStore.loading && listStore.lists.length === 0" title="暂无清单" description="创建第一个清单开始管理任务" />
    </div>
    <van-dialog v-model:show="showCreate" title="新建清单" show-cancel-button @confirm="handleCreate">
      <van-field v-model="newName" placeholder="清单名称" style="margin: 16px 0" />
    </van-dialog>
    
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 50px; }
.content { padding: 12px 0; }
.list-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; margin-right: 8px; }
</style>
