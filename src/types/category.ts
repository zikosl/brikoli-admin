import type { DateValue } from './user';

export interface Category {
  id: string;
  title: string;
  titleAr: string;
  image: string;
  active: boolean;
  createdAt: DateValue;
  updatedAt: DateValue;
  subCategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  categoryId: string;
  title: string;
  titleAr: string;
  image: string;
  active: boolean;
  createdAt: DateValue;
  updatedAt: DateValue;
}

export interface CategoryFormValues {
  title: string;
  titleAr: string;
  image: string;
  active: boolean;
}

export interface SubCategoryFormValues extends CategoryFormValues {
  categoryId: string;
}
