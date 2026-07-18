import type { DateValue } from './user';

export interface Service {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  categoryId: string;
  subCategoryId: string;
  category: string;
  categoryAr: string;
  categoryTitle: string;
  categoryTitleAr: string;
  subCategoryTitle: string;
  subCategoryTitleAr: string;
  image: string;
  active: boolean;
  createdAt: DateValue;
  updatedAt: DateValue;
}

export interface ServiceFormValues {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  categoryId: string;
  subCategoryId: string;
  category: string;
  categoryAr: string;
  image: string;
  active: boolean;
}
