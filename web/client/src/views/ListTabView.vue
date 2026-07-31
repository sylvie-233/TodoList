<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { showConfirmDialog, showToast } from 'vant';
import { useRoute, useRouter } from 'vue-router';
import { useListStore } from '@/stores/list.js';
import { useTaskStore } from '@/stores/task.js';
import NavBar from '@/components/NavBar.vue';
import TaskCard from '@/components/TaskCard.vue';
import EmptyState from '@/components/EmptyState.vue';

const listStore = useListStore();
const taskStore = useTaskStore();
const route = useRoute();
const router = useRouter();

const selectedId = ref<string>('');
const showManager = ref(false);
const editingName = ref('');
const editingColor = ref('#6366f1');
const editingTarget = ref<{ id: string; name: string; color: string } | null>(null);

const presetColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#78716c'];

const selectedName = computed(() => {
  if (!selectedId.value) return '全部';
  return listStore.lists.find((l) => l.id === selectedId.value)?.name ?? '';
});

async function selectList(id: string) {
  selectedId.value = id;
  taskStore.tasks = [];
  if (id) {
    await taskStore.fetchTasks({ listId: id });
  } else {
    await taskStore.fetchTasks();
  }
}

async function loadLists() {
  await listStore.fetchLists();
  if (route.query.list) {
    selectedId.value = route.query.list as string;
  }
  await selectList(selectedId.value);
}

// 管理：新建清单
function openCreate() {
  editingTarget.value = null;
  editingName.value = '';
  editingColor.value = '#6366f1';
}

// 管理：编辑
function openEdit(list: { id: string; name: string; color: string }) {
  editingTarget.value = list;
  editingName.value = list.name;
  editingColor.value = list.color;
}

async function saveList() {
  if (!editingName.value.trim()) return;
  if (editingTarget.value) {
    await listStore.updateList(editingTarget.value.id, { name: editingName.value.trim(), color: editingColor.value });
    showToast('清单已更新');
  } else {
    await listStore.createList({ name: editingName.value.trim(), color: editingColor.value });
    showToast('清单已创建');
  }
  editingTarget.value = null;
  loadLists();
}

async function deleteList(id: string) {
  await showConfirmDialog({ title: '删除清单', message: '清单下的任务不会被删除，仅取消关联', confirmButtonText: '删除', cancelButtonText: '取消' });
  await listStore.deleteList(id);
  if (selectedId.value === id) selectedId.value = '';
  loadLists();
}

function handleToggle(id: string) { taskStore.toggleTask(id); showToast('状态已更新'); }
function handleDelete(id: string) { taskStore.deleteTask(id); showToast('已移入回收站'); }

onMounted(loadLists);
</script>

<template>
  <div class="page">
    <NavBar :title="selectedName">
      <template #right>
        <van-icon name="setting-o" size="20" @click="showManager = true" />
      </template>
    </NavBar>

    <!-- 清单横向选择器 -->
    <div class="list-tabs">
      <div
        class="tab-item"
        :class="{ active: !selectedId }"
        @click="selectList('')"
      >全部</div>
      <div
        v-for="list in listStore.lists"
        :key="list.id"
        class="tab-item"
        :class="{ active: selectedId === list.id }"
        :style="selectedId === list.id ? { color: list.color, borderColor: list.color } : {}"
        @click="selectList(list.id)"
      >
        <span class="tab-dot" :style="{ background: list.color }" />
        {{ list.name }}
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="content">
      <van-pull-refresh v-model="taskStore.loading" @refresh="loadLists">
        <TaskCard
          v-for="task in taskStore.tasks"
          :key="task.id"
          :task="task"
          @toggle="handleToggle"
          @delete="handleDelete"
        />
      </van-pull-refresh>
      <EmptyState
        v-if="!taskStore.loading && taskStore.tasks.length === 0"
        :title="selectedId ? '该清单暂无任务' : '暂无任务'"
      />
    </div>

    <!-- 管理弹窗 -->
    <van-popup v-model:show="showManager" position="bottom" round :style="{ height: '70%' }">
      <div class="manager-header">
        <span>清单管理</span>
        <van-icon name="cross" size="20" @click="showManager = false" />
      </div>

      <!-- 编辑表单 -->
      <div v-if="editingTarget !== null || editingTarget === null && editingName !== undefined" class="edit-form">
        <van-field v-model="editingName" :placeholder="editingTarget ? '修改名称' : '新清单名称'" />
        <div class="color-row">
          <span
            v-for="c in presetColors" :key="c"
            class="color-dot" :class="{ active: editingColor === c }"
            :style="{ background: c }" @click="editingColor = c"
          />
        </div>
        <div style="margin: 8px 16px">
          <van-button block type="primary" size="small" @click="saveList">{{ editingTarget ? '保存' : '创建' }}</van-button>
        </div>
        <div style="margin: 0 16px" v-if="editingTarget">
          <van-button block plain size="small" @click="editingTarget = null">取消编辑</van-button>
        </div>
      </div>

      <!-- 清单列表 -->
      <div class="manager-list">
        <van-cell
          v-for="list in listStore.lists"
          :key="list.id"
          :title="list.name"
          @click="openEdit(list)"
        >
          <template #icon>
            <span class="cell-dot" :style="{ background: list.color }" />
          </template>
          <template #right-icon>
            <van-icon v-if="!list.isBuiltin" name="delete-o" color="#999" @click.stop="deleteList(list.id)" />
          </template>
        </van-cell>
      </div>

      <div style="padding: 8px 16px">
        <van-button block plain type="primary" icon="plus" size="small" @click="openCreate">新建清单</van-button>
      </div>

      <!-- 隐藏编辑表单 -->
      <div v-if="editingTarget === null && editingName === ''" style="display: none" />
    </van-popup>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 50px; }
.content { min-height: 60vh; }

/* 横向清单选择器 */
.list-tabs {
  display: flex; gap: 6px; padding: 10px 12px;
  overflow-x: auto; white-space: nowrap;
  background: var(--color-bg-card);
  -webkit-overflow-scrolling: touch;
}
.list-tabs::-webkit-scrollbar { display: none; }
.tab-item {
  flex-shrink: 0; padding: 6px 14px;
  border-radius: 16px; font-size: var(--font-size-sm);
  background: var(--color-bg); color: var(--color-text-secondary);
  border: 1px solid transparent; cursor: pointer;
  display: flex; align-items: center; gap: 4px;
}
.tab-item.active {
  background: var(--color-primary); color: white;
  border-color: var(--color-primary);
}
.tab-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* 管理弹窗 */
.manager-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px; font-size: var(--font-size-lg); font-weight: 600;
}
.manager-list { max-height: 50vh; overflow-y: auto; }
.cell-dot { width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; }
.edit-form { padding: 8px 0; border-bottom: 1px solid var(--color-border); }
.color-row { display: flex; gap: 8px; padding: 8px 16px; }
.color-dot { width: 24px; height: 24px; border-radius: 50%; cursor: pointer; border: 3px solid transparent; }
.color-dot.active { border-color: var(--color-text); transform: scale(1.15); }
</style>
