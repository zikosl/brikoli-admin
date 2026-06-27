import type { Timestamp } from 'firebase/firestore';

export interface Rating {
  id: string;
  requestId: string;
  clientId: string;
  workerId: string;
  rating: number;
  comment: string;
  createdAt: Timestamp | null;
}
