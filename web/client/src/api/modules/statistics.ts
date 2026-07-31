import { get } from '../request.js';
import type { DashboardStats, TrendDataPoint, OverdueSummary } from '@todolist/shared';

export const statisticsApi = {
  dashboard: () => get<DashboardStats>('/statistics/dashboard'),
  trends: (days?: number) => get<TrendDataPoint[]>('/statistics/trends', { days }),
  overdue: () => get<OverdueSummary>('/statistics/overdue'),
};
