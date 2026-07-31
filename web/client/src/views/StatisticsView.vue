<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useStatisticsStore } from '@/stores/statistics.js';
import NavBar from '@/components/NavBar.vue';
import EmptyState from '@/components/EmptyState.vue';

use([BarChart, LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

const statsStore = useStatisticsStore();
const days = ref(7);

const chartOption = computed(() => {
  const isBar = days.value === 7;
  return {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 0, right: 10, top: 10, bottom: 20 },
    xAxis: {
      type: 'category' as const,
      data: statsStore.trends.map((d) => d.date.slice(5)),
      axisLabel: { fontSize: 10, color: '#999' },
      axisLine: { lineStyle: { color: '#eee' } },
    },
    yAxis: {
      type: 'value' as const,
      minInterval: 1,
      axisLabel: { fontSize: 10, color: '#999' },
      splitLine: { lineStyle: { color: '#f5f5f5' } },
    },
    series: [{
      type: isBar ? 'bar' : 'line',
      data: statsStore.trends.map((d) => d.completed),
      itemStyle: { color: '#6366f1' },
      barMaxWidth: 16,
      smooth: !isBar,
      symbol: isBar ? 'none' : 'circle',
      symbolSize: 4,
      lineStyle: { width: 2 },
    }],
  };
});

onMounted(() => loadData());

async function loadData() {
  await Promise.all([
    statsStore.fetchDashboard(),
    statsStore.fetchTrends(days.value),
    statsStore.fetchOverdue(),
  ]);
}

async function switchDays(n: number) {
  days.value = n;
  await statsStore.fetchTrends(n);
}
</script>

<template>
  <div class="page">
    <NavBar title="统计" />
    <div class="content">
      <!-- KPI 卡片 -->
      <div class="kpi-grid" v-if="statsStore.dashboard">
        <div class="kpi-card">
          <span class="kpi-value">{{ statsStore.dashboard.totalTasks }}</span>
          <span class="kpi-label">全部任务</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-value">{{ statsStore.dashboard.completedTasks }}</span>
          <span class="kpi-label">已完成</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-value">{{ statsStore.dashboard.completionRate }}%</span>
          <span class="kpi-label">完成率</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-value">{{ statsStore.dashboard.overdueCount }}</span>
          <span class="kpi-label">已逾期</span>
        </div>
      </div>

      <!-- 趋势图 -->
      <div class="section">
        <h3 class="section-title">
          近 {{ days }} 天完成趋势
          <span style="margin-left: 8px">
            <van-button size="mini" :type="days === 7 ? 'primary' : 'default'" @click="switchDays(7)">7天</van-button>
            <van-button size="mini" :type="days === 30 ? 'primary' : 'default'" @click="switchDays(30)">30天</van-button>
          </span>
        </h3>
        <div v-if="statsStore.trends.length" style="height: 160px">
          <v-chart :option="chartOption" autoresize />
        </div>
        <EmptyState v-else title="暂无趋势数据" />
      </div>

      <!-- 逾期任务 -->
      <div class="section" v-if="statsStore.overdue && statsStore.overdue.items.length">
        <h3 class="section-title">逾期任务 ({{ statsStore.overdue.total }})</h3>
        <div v-for="item in statsStore.overdue.items.slice(0, 10)" :key="item.id" class="overdue-item">
          <span class="overdue-title">{{ item.title }}</span>
          <span class="overdue-days">逾期 {{ item.daysOverdue }} 天</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); padding-bottom: 50px; }
.content { padding: 12px; }
.kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.kpi-card {
  background: var(--color-bg-card); border-radius: var(--radius-md);
  padding: 20px 16px; text-align: center;
}
.kpi-value { display: block; font-size: 28px; font-weight: 700; color: var(--color-primary); }
.kpi-label { font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-top: 4px; display: block; }
.section { background: var(--color-bg-card); border-radius: var(--radius-md); padding: 12px; margin-bottom: 12px; }
.section-title { font-size: var(--font-size-sm); font-weight: 600; margin-bottom: 10px; display: flex; align-items: center; }
.overdue-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
.overdue-days { color: var(--color-danger); font-size: var(--font-size-xs); white-space: nowrap; }
.overdue-title { flex: 1; margin-right: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
