import { apiFetch } from './apiClient';
import type { Category, CategoryFormValues, SubCategory, SubCategoryFormValues } from '../types/category';

type ApiSubCategory = {
  id: string;
  categoryId: string;
  title: string;
  titleAr?: string | null;
  image?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiCategory = {
  id: string;
  title: string;
  titleAr?: string | null;
  image?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  subCategories?: ApiSubCategory[];
};

const mapSubCategory = (subCategory: ApiSubCategory): SubCategory => ({
  id: subCategory.id,
  categoryId: subCategory.categoryId,
  title: subCategory.title,
  titleAr: subCategory.titleAr ?? '',
  image: subCategory.image ?? '',
  active: subCategory.active,
  createdAt: subCategory.createdAt,
  updatedAt: subCategory.updatedAt,
});

const mapCategory = (category: ApiCategory): Category => ({
  id: category.id,
  title: category.title,
  titleAr: category.titleAr ?? '',
  image: category.image ?? '',
  active: category.active,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
  subCategories: (category.subCategories ?? []).map(mapSubCategory),
});

export async function getCategories(activeOnly = false) {
  const categories = await apiFetch<ApiCategory[]>(`/categories${activeOnly ? '?activeOnly=true' : ''}`);
  return categories.map(mapCategory);
}

export async function createCategory(values: CategoryFormValues) {
  const category = await apiFetch<ApiCategory>('/categories', {
    method: 'POST',
    body: JSON.stringify(values),
  });
  return mapCategory(category);
}

export async function updateCategory(id: string, values: Partial<CategoryFormValues>) {
  const category = await apiFetch<ApiCategory>(`/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(values),
  });
  return mapCategory(category);
}

export async function deleteCategory(id: string) {
  await apiFetch(`/categories/${id}`, { method: 'DELETE' });
}

export async function createSubCategory(values: SubCategoryFormValues) {
  const subCategory = await apiFetch<ApiSubCategory>('/sub-categories', {
    method: 'POST',
    body: JSON.stringify(values),
  });
  return mapSubCategory(subCategory);
}

export async function updateSubCategory(id: string, values: Partial<SubCategoryFormValues>) {
  const subCategory = await apiFetch<ApiSubCategory>(`/sub-categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(values),
  });
  return mapSubCategory(subCategory);
}

export async function deleteSubCategory(id: string) {
  await apiFetch(`/sub-categories/${id}`, { method: 'DELETE' });
}
