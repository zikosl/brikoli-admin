import { Plus, Save, Trash2 } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import { useEffect, useState, type FormEvent } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useLanguage } from '../context/LanguageContext';
import { getSettings, updateSettings } from '../services/settingsService';
import type { AppSettingsFormValues } from '../types/settings';
import { formatDate } from '../utils/formatDate';

const emptyForm: AppSettingsFormValues = {
  cities: [],
  categories: [],
  supportPhone: '',
  commissionPercentage: 0,
  emergencyEnabled: false,
};

export default function Settings() {
  const { locale, t } = useLanguage();
  const [form, setForm] = useState<AppSettingsFormValues>(emptyForm);
  const [cityInput, setCityInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Timestamp | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const settings = await getSettings();
        setForm({
          cities: settings.cities,
          categories: settings.categories,
          supportPhone: settings.supportPhone,
          commissionPercentage: settings.commissionPercentage,
          emergencyEnabled: settings.emergencyEnabled,
        });
        setUpdatedAt(settings.updatedAt);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : t('settings.loadError'));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const addItem = (field: 'cities' | 'categories', value: string) => {
    const normalized = value.trim();

    if (!normalized) {
      return;
    }

    setForm((current) => ({
      ...current,
      [field]: current[field].includes(normalized) ? current[field] : [...current[field], normalized].sort(),
    }));

    if (field === 'cities') {
      setCityInput('');
    } else {
      setCategoryInput('');
    }
  };

  const removeItem = (field: 'cities' | 'categories', value: string) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].filter((item) => item !== value),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await updateSettings(form);
      const settings = await getSettings();
      setUpdatedAt(settings.updatedAt);
      setMessage(t('settings.saved'));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label={t('common.loading')} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('settings.title')}</h1>
        <p className="page-subtitle">{t('settings.subtitle')}</p>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <section className="panel p-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="label">{t('settings.supportPhone')}</span>
              <input
                className="input"
                value={form.supportPhone}
                onChange={(event) => setForm((current) => ({ ...current, supportPhone: event.target.value }))}
              />
            </label>
            <label className="space-y-2">
              <span className="label">{t('settings.commissionPercentage')}</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                className="input"
                value={form.commissionPercentage}
                onChange={(event) =>
                  setForm((current) => ({ ...current, commissionPercentage: Number(event.target.value) }))
                }
              />
            </label>
          </div>
          <label className="mt-5 flex items-center gap-3 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              checked={form.emergencyEnabled}
              onChange={(event) => setForm((current) => ({ ...current, emergencyEnabled: event.target.checked }))}
            />
            {t('settings.emergencyEnabled')}
          </label>
          <p className="mt-4 text-xs text-gray-500">{t('settings.lastUpdated', { date: formatDate(updatedAt, undefined, locale) })}</p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <SettingsList
            title={t('settings.cities')}
            value={cityInput}
            items={form.cities}
            placeholder={t('settings.addCity')}
            onInputChange={setCityInput}
            onAdd={() => addItem('cities', cityInput)}
            onRemove={(value) => removeItem('cities', value)}
          />
          <SettingsList
            title={t('settings.serviceCategories')}
            value={categoryInput}
            items={form.categories}
            placeholder={t('settings.addCategory')}
            onInputChange={setCategoryInput}
            onAdd={() => addItem('categories', categoryInput)}
            onRemove={(value) => removeItem('categories', value)}
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? t('common.saving') : t('settings.saveSettings')}
          </button>
        </div>
      </form>
    </div>
  );
}

interface SettingsListProps {
  title: string;
  items: string[];
  value: string;
  placeholder: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (value: string) => void;
}

function SettingsList({ title, items, value, placeholder, onInputChange, onAdd, onRemove }: SettingsListProps) {
  const { t } = useLanguage();

  return (
    <section className="panel p-5">
      <h2 className="mb-4 text-lg font-semibold text-gray-950">{title}</h2>
      <div className="flex flex-col gap-2 xs:flex-row">
        <input
          className="input"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onAdd();
            }
          }}
        />
        <button type="button" className="btn-secondary h-10 w-full p-0 xs:w-10" onClick={onAdd} title={t('settings.addTitle', { title })}>
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.length === 0 ? <p className="text-sm text-gray-500">{t('common.noEntries')}</p> : null}
        {items.map((item) => (
          <span key={item} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
            {item}
            <button type="button" className="text-gray-500 hover:text-red-600" onClick={() => onRemove(item)} title={t('settings.removeTitle', { item })}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
    </section>
  );
}
