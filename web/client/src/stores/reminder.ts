import { defineStore } from 'pinia';
import { ref } from 'vue';
import { reminderApi } from '@/api/index.js';
import type { Reminder, CreateReminderDto, UpdateReminderDto } from '@todolist/shared';

export const useReminderStore = defineStore('reminder', () => {
  const reminders = ref<Reminder[]>([]);
  const loading = ref(false);

  async function createReminder(dto: CreateReminderDto) {
    const r = await reminderApi.create(dto);
    reminders.value.push(r);
    return r;
  }

  async function updateReminder(id: string, dto: UpdateReminderDto) {
    const updated = await reminderApi.update(id, dto);
    const idx = reminders.value.findIndex((r) => r.id === id);
    if (idx >= 0) reminders.value[idx] = updated;
    return updated;
  }

  async function deleteReminder(id: string) {
    await reminderApi.remove(id);
    reminders.value = reminders.value.filter((r) => r.id !== id);
  }

  async function fetchUpcoming(page?: number) {
    loading.value = true;
    try {
      const res = await reminderApi.upcoming(page);
      reminders.value = res.data as unknown as Reminder[];
    } finally {
      loading.value = false;
    }
  }

  return { reminders, loading, createReminder, updateReminder, deleteReminder, fetchUpcoming };
});
