import { X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { Category } from '../types/category';
import type { WorkerProfileFormValues, WorkerUser } from '../types/user';

interface WorkerFormModalProps {
  open: boolean;
  worker?: WorkerUser | null;
  categories: Category[];
  onClose: () => void;
  onSubmit: (values: WorkerProfileFormValues) => Promise<void>;
}

const emptyValues: WorkerProfileFormValues = {
  fullName: '',
  email: '',
  phoneNumber: '',
  city: '',
  categoryIds: [],
  subCategoryIds: [],
  available: true,
  active: true,
  profileImage: '',
  password: '',
};

export default function WorkerFormModal({ open, worker, categories, onClose, onSubmit }: WorkerFormModalProps) {
  const { t } = useLanguage();
  const [values, setValues] = useState<WorkerProfileFormValues>(emptyValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(
      worker
        ? {
            fullName: worker.fullName,
            email: worker.email,
            phoneNumber: worker.phoneNumber,
            city: worker.city,
            categoryIds: worker.categoryIds,
            subCategoryIds: worker.subCategoryIds,
            available: worker.available,
            active: worker.active,
            profileImage: worker.profileImage,
            password: '',
          }
        : emptyValues,
    );
  }, [open, worker]);

  const toggleValue = (key: 'categoryIds' | 'subCategoryIds', id: string) => {
    setValues((current) => ({
      ...current,
      [key]: current[key].includes(id)
        ? current[key].filter((item) => item !== id)
        : [...current[key], id],
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSubmit(values);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('workers.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-950/40 px-3 py-4 sm:px-4 sm:py-8">
      <div className="mx-auto w-full max-w-3xl rounded-lg bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-950">{worker ? t('workers.editWorker') : t('workers.createProfile')}</h2>
          <button type="button" className="btn-secondary h-9 w-9 p-0" onClick={onClose} title={t('common.close')}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <form className="space-y-5 p-4 sm:p-6" onSubmit={handleSubmit}>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {t('workers.authNote')}
          </div>
          {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="label">{t('common.fullName')}</span>
              <input
                className="input"
                value={values.fullName}
                onChange={(event) => setValues((current) => ({ ...current, fullName: event.target.value }))}
                required
              />
            </label>
            <label className="space-y-2">
              <span className="label">{t('common.email')}</span>
              <input
                type="email"
                className="input"
                value={values.email}
                onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </label>
            <label className="space-y-2">
              <span className="label">{t('common.phoneNumber')}</span>
              <input
                className="input"
                value={values.phoneNumber}
                onChange={(event) => setValues((current) => ({ ...current, phoneNumber: event.target.value }))}
                required
              />
            </label>
            <label className="space-y-2">
              <span className="label">{t('common.city')}</span>
              <input
                className="input"
                value={values.city}
                onChange={(event) => setValues((current) => ({ ...current, city: event.target.value }))}
                required
              />
            </label>
          </div>
          <label className="space-y-2">
            <span className="label">{t('common.profileImageUrl')}</span>
            <input
              className="input"
              value={values.profileImage}
              onChange={(event) => setValues((current) => ({ ...current, profileImage: event.target.value }))}
              placeholder="https://..."
            />
          </label>
          <label className="space-y-2">
            <span className="label">{t('common.password')}</span>
            <input
              type="password"
              className="input"
              value={values.password ?? ''}
              onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
              required={!worker}
              minLength={8}
              placeholder={worker ? 'Leave empty to keep current password' : undefined}
            />
          </label>
          <div className="space-y-2">
            <span className="label">{t('workers.assignedServices')}</span>
            <div className="space-y-4 rounded-lg border border-gray-200 p-3">
              {categories.map((category) => (
                <div key={category.id} className="space-y-2">
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${
                      values.categoryIds.includes(category.id)
                        ? 'bg-brand-600 text-white ring-brand-600'
                        : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => toggleValue('categoryIds', category.id)}
                  >
                    {category.title}
                  </button>
                  {category.subCategories.length > 0 ? (
                    <div className="flex flex-wrap gap-2 ps-3">
                      {category.subCategories.map((subCategory) => (
                        <button
                          key={subCategory.id}
                          type="button"
                          className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${
                            values.subCategoryIds.includes(subCategory.id)
                              ? 'bg-emerald-600 text-white ring-emerald-600'
                              : 'bg-gray-50 text-gray-700 ring-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => toggleValue('subCategoryIds', subCategory.id)}
                        >
                          {subCategory.title}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                checked={values.available}
                onChange={(event) => setValues((current) => ({ ...current, available: event.target.checked }))}
              />
              {t('common.available')}
            </label>
            <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                checked={values.active}
                onChange={(event) => setValues((current) => ({ ...current, active: event.target.checked }))}
              />
              {t('common.active')}
            </label>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
              {saving ? t('common.saving') : t('workers.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
