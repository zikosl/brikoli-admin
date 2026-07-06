import type { DateValue } from './user';

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  active: boolean;
  createdAt: DateValue;
  updatedAt: DateValue;
}

export interface ServiceFormValues {
  name: string;
  description: string;
  category: string;
  image: string;
  active: boolean;
}
