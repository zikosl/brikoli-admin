import type { DateValue } from './user';

export interface Rating {
  id: string;
  requestId: string;
  clientId: string;
  workerId: string;
  rating: number;
  comment: string;
  createdAt: DateValue;
}
