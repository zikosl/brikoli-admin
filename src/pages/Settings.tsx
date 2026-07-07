import { Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useLanguage } from '../context/LanguageContext';
import { getSettings, updateSettings } from '../services/settingsService';
import type { AppSettingsFormValues, ServiceCategoryOption } from '../types/settings';
import type { DateValue } from '../types/user';
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
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [categoryNameArInput, setCategoryNameArInput] = useState('');
  const [updatedAt, setUpdatedAt] = useState<DateValue>(null);
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

  const slugify = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'category';

  const addCity = (value: string) => {
    const normalized = value.trim();

    if (!normalized) {
      return;
    }

    setForm((current) => ({
      ...current,
      cities: current.cities.includes(normalized) ? current.cities : [...current.cities, normalized].sort(),
    }));

    setCityInput('');
  };

  const removeCity = (value: string) => {
    setForm((current) => ({
      ...current,
      cities: current.cities.filter((item) => item !== value),
    }));
  };

  const addCategory = () => {
    const name = categoryNameInput.trim();
    const nameAr = categoryNameArInput.trim();

    if (!name || !nameAr) {
      return;
    }

    const baseId = slugify(name);
    setForm((current) => {
      const existingIds = new Set(current.categories.map((category) => category.id));
      let id = baseId;
      let index = 2;

      while (existingIds.has(id)) {
        id = `${baseId}-${index}`;
        index += 1;
      }

      return {
        ...current,
        categories: [...current.categories, { id, name, nameAr, active: true }].sort((a, b) => a.name.localeCompare(b.name)),
      };
    });
    setCategoryNameInput('');
    setCategoryNameArInput('');
  };

  const updateCategory = (id: string, updates: Partial<ServiceCategoryOption>) => {
    setForm((current) => ({
      ...current,
      categories: current.categories.map((category) => category.id === id ? { ...category, ...updates } : category),
    }));
  };

  const removeCategory = (id: string) => {
    setForm((current) => ({
      ...current,
      categories: current.categories.filter((category) => category.id !== id),
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
            onAdd={() => addCity(cityInput)}
            onRemove={removeCity}
          />
          <CategorySettingsList
            categories={form.categories}
            nameValue={categoryNameInput}
            nameArValue={categoryNameArInput}
            onNameChange={setCategoryNameInput}
            onNameArChange={setCategoryNameArInput}
            onAdd={addCategory}
            onUpdate={updateCategory}
            onRemove={removeCategory}
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

interface CategorySettingsListProps {
  categories: ServiceCategoryOption[];
  nameValue: string;
  nameArValue: string;
  onNameChange: (value: string) => void;
  onNameArChange: (value: string) => void;
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<ServiceCategoryOption>) => void;
  onRemove: (id: string) => void;
}

function CategorySettingsList({
  categories,
  nameValue,
  nameArValue,
  onNameChange,
  onNameArChange,
  onAdd,
  onUpdate,
  onRemove,
}: CategorySettingsListProps) {
  const { t } = useLanguage();

  return (
    <section className="panel p-5">
      <h2 className="mb-4 text-lg font-semibold text-gray-950">{t('settings.serviceCategories')}</h2>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          className="input"
          value={nameValue}
          placeholder={t('settings.addCategoryEn')}
          onChange={(event) => onNameChange(event.target.value)}
        />
        <input
          className="input"
          dir="rtl"
          value={nameArValue}
          placeholder={t('settings.addCategoryAr')}
          onChange={(event) => onNameArChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onAdd();
            }
          }}
        />
        <button type="button" className="btn-secondary h-10 w-full p-0 sm:w-10" onClick={onAdd} title={t('settings.addCategory')}>
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {categories.length === 0 ? <p className="text-sm text-gray-500">{t('common.noEntries')}</p> : null}
        {categories.map((category) => (
          <div key={category.id} className="grid gap-2 rounded-md border border-gray-100 bg-gray-50 p-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center">
            <input
              className="input bg-white"
              value={category.name}
              onChange={(event) => onUpdate(category.id, { name: event.target.value })}
            />
            <input
              className="input bg-white"
              dir="rtl"
              value={category.nameAr}
              onChange={(event) => onUpdate(category.id, { nameAr: event.target.value })}
            />
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                checked={category.active}
                onChange={(event) => onUpdate(category.id, { active: event.target.checked })}
              />
              {t('common.active')}
            </label>
            <button type="button" className="btn-secondary h-10 w-full p-0 text-red-600 hover:text-red-700 sm:w-10" onClick={() => onRemove(category.id)} title={t('settings.removeTitle', { item: category.name })}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </section>
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
