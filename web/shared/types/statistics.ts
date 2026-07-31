export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  completionRate: number;
  overdueCount: number;
  todayCount: number;
}

export interface TrendDataPoint {
  date: string;
  completed: number;
  created: number;
}

export interface OverdueItem {
  id: string;
  title: string;
  dueDate: string;
  daysOverdue: number;
  priority: string;
}

export interface OverdueSummary {
  total: number;
  items: OverdueItem[];
}
