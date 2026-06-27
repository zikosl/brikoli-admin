import type { Timestamp } from 'firebase/firestore';

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  active: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface ServiceFormValues {
  name: string;
  description: string;
  category: string;
  image: string;
  active: boolean;
}
