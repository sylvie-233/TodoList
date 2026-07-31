/** 任务优先级 */
export enum Priority {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/** 提醒重复类型 */
export enum RecurType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

/** 任务状态筛选 */
export enum TaskStatus {
  ALL = 'all',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

/** 批量操作类型 */
export enum BatchAction {
  DELETE = 'delete',
  COMPLETE = 'complete',
  UPDATE_PRIORITY = 'updatePriority',
  MOVE_TO_LIST = 'moveToList',
  UPDATE_TAGS = 'updateTags',
}
