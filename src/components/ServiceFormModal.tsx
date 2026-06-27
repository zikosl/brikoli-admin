import { Image, UploadCloud, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { Service, ServiceFormValues } from '../types/service';

interface ServiceFormModalProps {
  open: boolean;
  service?: Service | null;
  categories: string[];
  onClose: () => void;
  onSubmit: (values: ServiceFormValues, file: File | null) => Promise<void>;
}

const emptyValues: ServiceFormValues = {
  name: '',
  description: '',
  category: '',
  image: '',
  active: true,
};

export default function ServiceFormModal({ open, service, categories, onClose, onSubmit }: ServiceFormModalProps) {
  const { t } = useLanguage();
  const [values, setValues] = useState<ServiceFormValues>(emptyValues);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(
      service
        ? {
            name: service.name,
            description: service.description,
            category: service.category,
            image: service.image,
            active: service.active,
          }
        : emptyValues,
    );
    setFile(null);
  }, [open, service]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      await onSubmit(values, file);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-950/40 px-3 py-4 sm:px-4 sm:py-8">
      <div className="mx-auto w-full max-w-2xl rounded-lg bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-950">{service ? t('services.edit') : t('services.create')}</h2>
          <button type="button" className="btn-secondary h-9 w-9 p-0" onClick={onClose} title={t('common.close')}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <form className="space-y-5 p-4 sm:p-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="label">{t('common.name')}</span>
              <input
                className="input"
                value={values.name}
                onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </label>
            <label className="space-y-2">
              <span className="label">{t('common.category')}</span>
              <input
                className="input"
                list="service-categories"
                value={values.category}
                onChange={(event) => setValues((current) => ({ ...current, category: event.target.value }))}
                required
              />
              <datalist id="service-categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </label>
          </div>
          <label className="space-y-2">
            <span className="label">{t('common.description')}</span>
            <textarea
              className="input min-h-28 resize-y"
              value={values.description}
              onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
              required
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <label className="space-y-2">
              <span className="label">{t('common.imageUrl')}</span>
              <div className="relative">
                <Image className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
                <input
                  className="input ps-9"
                  value={values.image}
                  onChange={(event) => setValues((current) => ({ ...current, image: event.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </label>
            <label className="space-y-2">
              <span className="label">{t('common.upload')}</span>
              <span className="btn-secondary cursor-pointer whitespace-nowrap">
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                {file ? t('common.selected') : t('common.chooseImage')}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </span>
            </label>
          </div>
          <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              checked={values.active}
              onChange={(event) => setValues((current) => ({ ...current, active: event.target.checked }))}
            />
            {t('services.activeService')}
          </label>
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
              {saving ? t('common.saving') : t('services.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
