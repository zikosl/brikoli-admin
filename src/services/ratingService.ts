import { apiFetch } from './apiClient';
import type { Rating } from '../types/rating';

interface ApiRating {
  id: string;
  requestId: string;
  clientId: string;
  workerId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export async function getRatings() {
  return apiFetch<ApiRating[]>('/ratings') as Promise<Rating[]>;
}
