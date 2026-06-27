import type { RequestStatus } from '../types/request';
import type { TranslationKey } from '../i18n/translations';

export const SETTINGS_DOC_ID = 'app';

export const REQUEST_STATUS_OPTIONS: Array<{ value: RequestStatus; labelKey: TranslationKey }> = [
  { value: 'pending', labelKey: 'status.pending' },
  { value: 'assigned', labelKey: 'status.assigned' },
  { value: 'accepted', labelKey: 'status.accepted' },
  { value: 'on_the_way', labelKey: 'status.onTheWay' },
  { value: 'in_progress', labelKey: 'status.inProgress' },
  { value: 'completed', labelKey: 'status.completed' },
  { value: 'cancelled', labelKey: 'status.cancelled' },
  { value: 'rejected', labelKey: 'status.rejected' },
];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, TranslationKey> = {
  pending: 'status.pending',
  assigned: 'status.assigned',
  accepted: 'status.accepted',
  on_the_way: 'status.onTheWay',
  in_progress: 'status.inProgress',
  completed: 'status.completed',
  cancelled: 'status.cancelled',
  rejected: 'status.rejected',
};

export const REQUEST_STATUS_CLASSES: Record<RequestStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  assigned: 'bg-blue-50 text-blue-700 ring-blue-200',
  accepted: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  on_the_way: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  in_progress: 'bg-violet-50 text-violet-700 ring-violet-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
  rejected: 'bg-gray-100 text-gray-700 ring-gray-200',
};

export const CHART_COLORS = ['#10b981', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
