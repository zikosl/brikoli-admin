import { Edit, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import DataTable, { type TableColumn } from '../components/DataTable';
import { useLanguage } from '../context/LanguageContext';
import {
  createCategory,
  createSubCategory,
  deleteCategory,
  deleteSubCategory,
  getCategories,
  updateCategory,
  updateSubCategory,
} from '../services/categoryService';
import type { Category, CategoryFormValues, SubCategory, SubCategoryFormValues } from '../types/category';

const emptyCategory: CategoryFormValues = { title: '', titleAr: '', image: '', active: true };
const emptySubCategory: SubCategoryFormValues = { categoryId: '', title: '', titleAr: '', image: '', active: true };

export default function Categories() {
  const { language, t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryValues, setCategoryValues] = useState<CategoryFormValues>(emptyCategory);
  const [subCategoryValues, setSubCategoryValues] = useState<SubCategoryFormValues>(emptySubCategory);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState<SubCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const nextCategories = await getCategories();
      setCategories(nextCategories);
      setSubCategoryValues((current) => ({ ...current, categoryId: current.categoryId || nextCategories[0]?.id || '' }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('categories.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const subCategories = useMemo(
    () => categories.flatMap((category) => category.subCategories.map((subCategory) => ({ ...subCategory, categoryTitle: category.title, categoryTitleAr: category.titleAr }))),
    [categories],
  );

  const submitCategory = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryValues);
      } else {
        await createCategory(categoryValues);
      }
      setEditingCategory(null);
      setCategoryValues(emptyCategory);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('categories.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const submitSubCategory = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingSubCategory) {
        await updateSubCategory(editingSubCategory.id, subCategoryValues);
      } else {
        await createSubCategory(subCategoryValues);
      }
      setEditingSubCategory(null);
      setSubCategoryValues({ ...emptySubCategory, categoryId: subCategoryValues.categoryId });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('categories.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const categoryColumns: Array<TableColumn<Category>> = [
    {
      header: t('common.category'),
      render: (category) => (
        <div className="flex items-center gap-3">
          {category.image ? <img src={category.image} alt="" className="h-11 w-11 rounded-md object-cover" /> : <ImagePlaceholder />}
          <div>
            <p className="font-medium text-gray-950">{language === 'ar' ? category.titleAr || category.title : category.title}</p>
            <p className="text-xs text-gray-500">{category.subCategories.length} {t('categories.subCategories')}</p>
          </div>
        </div>
      ),
    },
    { header: t('common.status'), render: (category) => category.active ? t('common.active') : t('common.inactive') },
    {
      header: t('common.actions'),
      className: 'text-end',
      render: (category) => (
        <ActionButtons
          onEdit={() => {
            setEditingCategory(category);
            setCategoryValues({ title: category.title, titleAr: category.titleAr, image: category.image, active: category.active });
          }}
          onDelete={() => setCategoryToDelete(category)}
        />
      ),
    },
  ];

  const subCategoryColumns: Array<TableColumn<SubCategory & { categoryTitle: string; categoryTitleAr: string }>> = [
    {
      header: t('categories.subCategory'),
      render: (subCategory) => (
        <div className="flex items-center gap-3">
          {subCategory.image ? <img src={subCategory.image} alt="" className="h-11 w-11 rounded-md object-cover" /> : <ImagePlaceholder />}
          <div>
            <p className="font-medium text-gray-950">{language === 'ar' ? subCategory.titleAr || subCategory.title : subCategory.title}</p>
            <p className="text-xs text-gray-500">{language === 'ar' ? subCategory.categoryTitleAr || subCategory.categoryTitle : subCategory.categoryTitle}</p>
          </div>
        </div>
      ),
    },
    { header: t('common.status'), render: (subCategory) => subCategory.active ? t('common.active') : t('common.inactive') },
    {
      header: t('common.actions'),
      className: 'text-end',
      render: (subCategory) => (
        <ActionButtons
          onEdit={() => {
            setEditingSubCategory(subCategory);
            setSubCategoryValues({
              categoryId: subCategory.categoryId,
              title: subCategory.title,
              titleAr: subCategory.titleAr,
              image: subCategory.image,
              active: subCategory.active,
            });
          }}
          onDelete={() => setSubCategoryToDelete(subCategory)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('categories.title')}</h1>
        <p className="page-subtitle">{t('categories.subtitle')}</p>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryForm
          title={editingCategory ? t('categories.editCategory') : t('categories.newCategory')}
          values={categoryValues}
          saving={saving}
          onChange={setCategoryValues}
          onSubmit={submitCategory}
          onCancel={() => {
            setEditingCategory(null);
            setCategoryValues(emptyCategory);
          }}
        />
        <SubCategoryForm
          title={editingSubCategory ? t('categories.editSubCategory') : t('categories.newSubCategory')}
          categories={categories}
          values={subCategoryValues}
          saving={saving}
          onChange={setSubCategoryValues}
          onSubmit={submitSubCategory}
          onCancel={() => {
            setEditingSubCategory(null);
            setSubCategoryValues({ ...emptySubCategory, categoryId: categories[0]?.id || '' });
          }}
        />
      </div>

      <DataTable data={categories} columns={categoryColumns} getRowKey={(category) => category.id} loading={loading} emptyTitle={t('categories.noCategories')} />
      <DataTable data={subCategories} columns={subCategoryColumns} getRowKey={(subCategory) => subCategory.id} loading={loading} emptyTitle={t('categories.noSubCategories')} />

      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        title={t('categories.deleteCategory')}
        message={t('categories.deleteCategoryMessage', { name: categoryToDelete?.title ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={async () => {
          if (categoryToDelete) {
            await deleteCategory(categoryToDelete.id);
            setCategoryToDelete(null);
            await load();
          }
        }}
        onCancel={() => setCategoryToDelete(null)}
      />
      <ConfirmDialog
        open={Boolean(subCategoryToDelete)}
        title={t('categories.deleteSubCategory')}
        message={t('categories.deleteSubCategoryMessage', { name: subCategoryToDelete?.title ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={async () => {
          if (subCategoryToDelete) {
            await deleteSubCategory(subCategoryToDelete.id);
            setSubCategoryToDelete(null);
            await load();
          }
        }}
        onCancel={() => setSubCategoryToDelete(null)}
      />
    </div>
  );
}

function CategoryForm({
  title,
  values,
  saving,
  onChange,
  onSubmit,
  onCancel,
}: {
  title: string;
  values: CategoryFormValues;
  saving: boolean;
  onChange: (values: CategoryFormValues) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  return (
    <form className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm" onSubmit={onSubmit}>
      <h2 className="mb-4 text-lg font-semibold text-gray-950">{title}</h2>
      <CategoryFields values={values} onChange={onChange} />
      <FormActions saving={saving} onCancel={onCancel} submitLabel={t('common.save')} />
    </form>
  );
}

function SubCategoryForm({
  title,
  categories,
  values,
  saving,
  onChange,
  onSubmit,
  onCancel,
}: {
  title: string;
  categories: Category[];
  values: SubCategoryFormValues;
  saving: boolean;
  onChange: (values: SubCategoryFormValues) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  return (
    <form className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm" onSubmit={onSubmit}>
      <h2 className="mb-4 text-lg font-semibold text-gray-950">{title}</h2>
      <label className="mb-3 block space-y-2">
        <span className="label">{t('common.category')}</span>
        <select className="input" value={values.categoryId} onChange={(event) => onChange({ ...values, categoryId: event.target.value })} required>
          <option value="">{t('services.chooseCategory')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.title} / {category.titleAr}</option>
          ))}
        </select>
      </label>
      <CategoryFields values={values} onChange={onChange} />
      <FormActions saving={saving} onCancel={onCancel} submitLabel={t('common.save')} />
    </form>
  );
}

function CategoryFields<T extends CategoryFormValues>({ values, onChange }: { values: T; onChange: (values: T) => void }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-3">
      <label className="block space-y-2">
        <span className="label">{t('categories.titleEn')}</span>
        <input className="input" value={values.title} onChange={(event) => onChange({ ...values, title: event.target.value })} required />
      </label>
      <label className="block space-y-2">
        <span className="label">{t('categories.titleAr')}</span>
        <input className="input" dir="rtl" value={values.titleAr} onChange={(event) => onChange({ ...values, titleAr: event.target.value })} required />
      </label>
      <label className="block space-y-2">
        <span className="label">{t('common.imageUrl')}</span>
        <input className="input" value={values.image} onChange={(event) => onChange({ ...values, image: event.target.value })} placeholder="https://..." />
      </label>
      <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          checked={values.active}
          onChange={(event) => onChange({ ...values, active: event.target.checked })}
        />
        {t('common.active')}
      </label>
    </div>
  );
}

function FormActions({ saving, onCancel, submitLabel }: { saving: boolean; onCancel: () => void; submitLabel: string }) {
  const { t } = useLanguage();
  return (
    <div className="mt-4 flex justify-end gap-2">
      <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>{t('common.cancel')}</button>
      <button type="submit" className="btn-primary" disabled={saving}>{saving ? t('common.saving') : submitLabel}</button>
    </div>
  );
}

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" className="btn-secondary h-9 w-9 p-0" onClick={onEdit}><Edit className="h-4 w-4" /></button>
      <button type="button" className="btn-secondary h-9 w-9 p-0 text-red-600 hover:text-red-700" onClick={onDelete}><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

function ImagePlaceholder() {
  return <div className="grid h-11 w-11 place-items-center rounded-md bg-gray-100 text-xs text-gray-400">IMG</div>;
}
