// 复用共享类型
export * from '@todolist/shared';

// 前端专用类型
export interface ViewType {
  key: string;
  label: string;
  icon?: string;
}

export interface TabItem {
  name: string;
  title: string;
  badge?: number;
}
