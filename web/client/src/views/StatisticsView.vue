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
        <div class="trend-bars" v-if="statsStore.trends.length">
          <div v-for="d in statsStore.trends" :key="d.date" class="bar-col">
            <div class="bar" :style="{ height: getBarHeight(d.completed) }">
              <span class="bar-tip" v-if="d.completed > 0">{{ d.completed }}</span>
            </div>
            <span class="bar-label">{{ d.date.slice(5) }}</span>
          </div>
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
    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useStatisticsStore } from '@/stores/statistics.js';
import NavBar from '@/components/NavBar.vue';
import TabBar from '@/components/TabBar.vue';
import EmptyState from '@/components/EmptyState.vue';

const statsStore = useStatisticsStore();
const days = ref(7);

onMounted(() => {
  loadData();
});

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

function getBarHeight(count: number): string {
  const values = statsStore.trends.map((d) => d.completed);
  const max = Math.max(...values, 1);
  return `${Math.max((count / max) * 80, 4)}px`;
}
</script>

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
.trend-bars { display: flex; gap: 3px; align-items: flex-end; height: 100px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
.bar {
  width: 100%; max-width: 20px; background: var(--color-primary-light);
  border-radius: 4px 4px 0 0; min-height: 4px; position: relative;
}
.bar-tip { position: absolute; top: -16px; left: 50%; transform: translateX(-50%); font-size: 9px; color: var(--color-text-secondary); }
.bar-label { font-size: 9px; color: var(--color-text-hint); margin-top: 3px; }
.overdue-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
.overdue-days { color: var(--color-danger); font-size: var(--font-size-xs); white-space: nowrap; }
.overdue-title { flex: 1; margin-right: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
