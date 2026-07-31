import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday.js';
import isTomorrow from 'dayjs/plugin/isTomorrow.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.extend(relativeTime);

export function formatDate(date: string | null | undefined, fallback = '-'): string {
  if (!date) return fallback;
  return dayjs(date).format('YYYY-MM-DD');
}

export function formatDateTime(date: string | null | undefined, fallback = '-'): string {
  if (!date) return fallback;
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

export function formatTime(time: string | null | undefined, fallback = ''): string {
  if (!time) return fallback;
  return dayjs(`2000-01-01T${time}`).format('HH:mm');
}

export function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  return dayjs(dueDate).isBefore(dayjs(), 'day');
}

export function isDueToday(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  return dayjs(dueDate).isToday();
}

/** 返回相对日期标签（中文）*/
export function getRelativeDateLabel(date: string | null | undefined): string {
  if (!date) return '';
  const d = dayjs(date);
  if (d.isToday()) return '今天';
  if (d.isTomorrow()) return '明天';
  if (d.diff(dayjs(), 'day') < 0) return `逾期${Math.abs(d.diff(dayjs(), 'day'))}天`;
  return d.format('M月D日');
}

export function formatDateGroup(date: string): string {
  const d = dayjs(date);
  if (d.isToday()) return '今天';
  if (d.isTomorrow()) return '明天';
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  if (d.diff(dayjs(), 'day') < 7) return weekdays[d.day()];
  if (d.year() === dayjs().year()) return d.format('M月D日');
  return d.format('YYYY年M月D日');
}

export { dayjs };
