<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { showToast } from 'vant';
import dayjs from 'dayjs';
import { Priority } from '@todolist/shared';
import type { CreateTaskDto, UpdateTaskDto, Task } from '@todolist/shared';
import { useListStore } from '@/stores/list.js';
import { useTagStore } from '@/stores/tag.js';
import { rules } from '@/utils/validation.js';

const props = defineProps<{ isEdit?: boolean; task?: Task | null; loading?: boolean }>();
const emit = defineEmits<{ submit: [dto: CreateTaskDto & Partial<UpdateTaskDto>] }>();

const listStore = useListStore();
const tagStore = useTagStore();
const allTags = computed(() => tagStore.tags);

const form = reactive<CreateTaskDto & { tagIds: string[] }>({
  title: '', description: '', listId: undefined, priority: Priority.NONE, dueDate: dayjs().format('YYYY-MM-DD'), tagIds: [],
});

const selectedListName = computed(() => {
  if (!form.listId) return '';
  return listStore.lists.find((l) => l.id === form.listId)?.name ?? '';
});
const selectedTagNames = computed(() => {
  if (!form.tagIds?.length) return '';
  return tagStore.tags.filter((t) => form.tagIds.includes(t.id)).map((t) => t.name).join('、');
});

const priorityColumns = [
  { text: '无', value: Priority.NONE }, { text: '低', value: Priority.LOW },
  { text: '中', value: Priority.MEDIUM }, { text: '高', value: Priority.HIGH }, { text: '紧急', value: Priority.URGENT },
];
const priorityLabel = computed(() => priorityColumns.find((p) => p.value === form.priority)?.text ?? '无');
const listColumns = computed(() => {
  const options = listStore.lists.map((l) => ({ text: l.name, value: l.id }));
  return [{ text: '未分类', value: '' }, ...options];
});

const showListPicker = ref(false);
const showPriorityPicker = ref(false);
const showDatePicker = ref(false);
const showTagPicker = ref(false);
const minDate = new Date(2020, 0, 1);

function onListConfirm({ selectedOptions }: { selectedOptions: { text: string; value: string }[] }) {
  form.listId = selectedOptions[0]?.value || undefined;
  showListPicker.value = false;
}
function onPriorityConfirm({ selectedOptions }: { selectedOptions: { text: string; value: string }[] }) {
  form.priority = (selectedOptions[0]?.value as Priority) ?? Priority.NONE;
  showPriorityPicker.value = false;
}
function onDateConfirm({ selectedValues }: { selectedValues: string[] }) {
  form.dueDate = selectedValues.join('-');
  showDatePicker.value = false;
}
function handleSubmit() {
  if (!form.title.trim()) { showToast('请输入标题'); return; }
  emit('submit', { ...form });
}

watch(() => props.task, (task) => {
  if (task) {
    form.title = task.title; form.description = task.description ?? '';
    form.listId = task.listId ?? undefined; form.priority = task.priority;
    form.dueDate = task.dueDate ?? undefined; form.tagIds = task.tags?.map((t) => t.id) ?? [];
  }
}, { immediate: true });

onMounted(() => { listStore.fetchLists(); tagStore.fetchTags(); });
</script>

<template>
  <van-form @submit="handleSubmit">
    <van-cell-group inset>
      <van-field v-model="form.title" label="标题" placeholder="要做什么？" :rules="[rules.required('标题')]" maxlength="200" />
      <van-field v-model="form.description" label="描述" placeholder="添加详情..." type="textarea" autosize />
      <van-field :model-value="selectedListName" label="清单" is-link readonly placeholder="选择清单" @click="showListPicker = true" />
      <van-field :model-value="priorityLabel" label="优先级" is-link readonly placeholder="无" @click="showPriorityPicker = true" />
      <van-field :model-value="form.dueDate ?? ''" label="截止日期" is-link readonly placeholder="选择日期" @click="showDatePicker = true" />
      <van-field :model-value="selectedTagNames" label="标签" is-link readonly placeholder="选择标签" @click="showTagPicker = true" />
    </van-cell-group>
    <div style="margin: 16px">
      <van-button block type="primary" native-type="submit" :loading="loading">{{ isEdit ? '保存' : '创建' }}</van-button>
    </div>

    <van-popup v-model:show="showListPicker" position="bottom" round>
      <van-picker :columns="listColumns" @confirm="onListConfirm" @cancel="showListPicker = false" />
    </van-popup>
    <van-popup v-model:show="showPriorityPicker" position="bottom" round>
      <van-picker :columns="priorityColumns" @confirm="onPriorityConfirm" @cancel="showPriorityPicker = false" />
    </van-popup>
    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker @confirm="onDateConfirm" @cancel="showDatePicker = false" :min-date="minDate" />
    </van-popup>
    <van-popup v-model:show="showTagPicker" position="bottom" round>
      <div style="padding: 16px">
        <van-checkbox-group v-model="form.tagIds">
          <van-cell-group>
            <van-cell v-for="tag in allTags" :key="tag.id" :title="tag.name" clickable>
              <template #right-icon><van-checkbox :name="tag.id" /></template>
            </van-cell>
          </van-cell-group>
        </van-checkbox-group>
        <van-button block type="primary" @click="showTagPicker = false" style="margin-top: 12px">完成</van-button>
      </div>
    </van-popup>
  </van-form>
</template>
