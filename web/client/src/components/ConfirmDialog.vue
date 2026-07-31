<template>
  <van-dialog
    v-model:show="show"
    :title="title"
    :message="message"
    :confirm-button-text="confirmText"
    :cancel-button-text="cancelText"
    :show-cancel-button="showCancel"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = withDefaults(
  defineProps<{
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
  }>(),
  {
    title: '确认操作',
    message: '',
    confirmText: '确定',
    cancelText: '取消',
    showCancel: true,
  },
);

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const show = ref(false);

function open() {
  show.value = true;
}

function handleConfirm() {
  emit('confirm');
}

function handleCancel() {
  emit('cancel');
}

defineExpose({ open });
</script>
