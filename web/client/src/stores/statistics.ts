import { defineStore } from 'pinia';
import { ref } from 'vue';
import { statisticsApi } from '@/api/index.js';
import type { DashboardStats, TrendDataPoint, OverdueSummary } from '@todolist/shared';

export const useStatisticsStore = defineStore('statistics', () => {
  const dashboard = ref<DashboardStats | null>(null);
  const trends = ref<TrendDataPoint[]>([]);
  const overdue = ref<OverdueSummary | null>(null);
  const loading = ref(false);

  async function fetchDashboard() {
    loading.value = true;
    try {
      dashboard.value = await statisticsApi.dashboard();
    } finally {
      loading.value = false;
    }
  }

  async function fetchTrends(days = 7) {
    trends.value = await statisticsApi.trends(days);
  }

  async function fetchOverdue() {
    overdue.value = await statisticsApi.overdue();
  }

  return { dashboard, trends, overdue, loading, fetchDashboard, fetchTrends, fetchOverdue };
});
