import { X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { Service } from '../types/service';
import type { WorkerProfileFormValues, WorkerUser } from '../types/user';

interface WorkerFormModalProps {
  open: boolean;
  worker?: WorkerUser | null;
  services: Service[];
  onClose: () => void;
  onSubmit: (values: WorkerProfileFormValues) => Promise<void>;
}

const emptyValues: WorkerProfileFormValues = {
  fullName: '',
  email: '',
  phoneNumber: '',
  city: '',
  services: [],
  available: true,
  active: true,
  profileImage: '',
};

export default function WorkerFormModal({ open, worker, services, onClose, onSubmit }: WorkerFormModalProps) {
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
            services: worker.services,
            available: worker.available,
            active: worker.active,
            profileImage: worker.profileImage,
          }
        : emptyValues,
    );
  }, [open, worker]);

  const toggleService = (serviceId: string) => {
    setValues((current) => ({
      ...current,
      services: current.services.includes(serviceId)
        ? current.services.filter((id) => id !== serviceId)
        : [...current.services, serviceId],
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
          <div className="space-y-2">
            <span className="label">{t('workers.assignedServices')}</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {services.map((service) => (
                <label
                  key={service.id}
                  className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    checked={values.services.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                  />
                  <span>{service.name}</span>
                </label>
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
