import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/tasks' },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false, title: '登录' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { requiresAuth: false, title: '注册' },
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('@/views/TaskIndexView.vue'),
    meta: { requiresAuth: true, title: '任务' },
  },
  {
    path: '/tasks/today',
    name: 'Today',
    component: () => import('@/views/TaskTodayView.vue'),
    meta: { requiresAuth: true, title: '今日任务' },
  },
  {
    path: '/tasks/planned',
    name: 'Planned',
    component: () => import('@/views/TaskPlannedView.vue'),
    meta: { requiresAuth: true, title: '计划任务' },
  },
  {
    path: '/tasks/completed',
    name: 'Completed',
    component: () => import('@/views/TaskCompletedView.vue'),
    meta: { requiresAuth: true, title: '已完成' },
  },
  {
    path: '/tasks/:id',
    name: 'TaskDetail',
    component: () => import('@/views/TaskDetailView.vue'),
    meta: { requiresAuth: true, title: '任务详情' },
  },
  {
    path: '/tasks/:id/edit',
    name: 'TaskEdit',
    component: () => import('@/views/TaskEditView.vue'),
    meta: { requiresAuth: true, title: '编辑任务' },
  },
  {
    path: '/recycle-bin',
    name: 'RecycleBin',
    component: () => import('@/views/RecycleBinView.vue'),
    meta: { requiresAuth: true, title: '回收站' },
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: () => import('@/views/CalendarView.vue'),
    meta: { requiresAuth: true, title: '日历' },
  },
  {
    path: '/lists',
    name: 'Lists',
    component: () => import('@/views/ListView.vue'),
    meta: { requiresAuth: true, title: '清单' },
  },
  {
    path: '/lists/:id',
    name: 'ListDetail',
    component: () => import('@/views/ListDetailView.vue'),
    meta: { requiresAuth: true, title: '清单详情' },
  },
  {
    path: '/tags',
    name: 'Tags',
    component: () => import('@/views/TagManageView.vue'),
    meta: { requiresAuth: true, title: '标签' },
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/SearchView.vue'),
    meta: { requiresAuth: true, title: '搜索' },
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('@/views/StatisticsView.vue'),
    meta: { requiresAuth: true, title: '统计' },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: true, title: '设置' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 登录守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('accessToken');
  if (to.meta.requiresAuth !== false && !token) {
    // 记住目标地址，登录后跳回
    next({ path: '/login', query: { redirect: to.fullPath } });
  } else if ((to.path === '/login' || to.path === '/register') && token) {
    next('/tasks');
  } else {
    next();
  }
});

// 动态 title
router.afterEach((to) => {
  document.title = `${(to.meta.title as string) ?? 'TodoList'} - TodoList`;
});

export default router;
