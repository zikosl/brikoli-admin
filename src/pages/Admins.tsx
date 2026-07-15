import { Pencil, Plus, Search, ShieldCheck, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import DataTable, { type TableColumn } from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { createAdmin, getAdmins, updateAdmin } from '../services/userService';
import type { AdminFormValues, AdminUser } from '../types/user';
import { formatDate } from '../utils/formatDate';

const initialForm: AdminFormValues = {
  fullName: '',
  email: '',
  password: '',
  active: true,
};

export default function Admins() {
  const { locale, t } = useLanguage();
  const { profile } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<AdminFormValues>(initialForm);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageAdmins = profile?.isGlobalAdmin === true;

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      setAdmins(await getAdmins());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('admins.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredAdmins = useMemo(() => {
    const needle = search.trim().toLowerCase();

    if (!needle) {
      return admins;
    }

    return admins.filter((admin) =>
      [admin.fullName, admin.email].some((value) => value.toLowerCase().includes(needle)),
    );
  }, [admins, search]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const values = {
        ...form,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
      };

      if (editingAdmin) {
        await updateAdmin(editingAdmin.uid, {
          fullName: values.fullName,
          email: values.email,
          active: editingAdmin.isGlobalAdmin ? true : values.active,
          password: values.password || undefined,
        });
      } else {
        await createAdmin(values);
      }
      setForm(initialForm);
      setEditingAdmin(null);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('admins.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setForm({
      fullName: admin.fullName,
      email: admin.email,
      password: '',
      active: admin.active,
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingAdmin(null);
    setForm(initialForm);
    setError(null);
  };

  const columns: Array<TableColumn<AdminUser>> = [
    {
      header: t('common.admin'),
      render: (admin) => (
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
            {admin.fullName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-950">{admin.fullName}</p>
            <p className="text-xs text-gray-500">{admin.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: t('admins.scope'),
      render: (admin) =>
        admin.isGlobalAdmin ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-200">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t('admins.global')}
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
            {t('admins.regular')}
          </span>
        ),
    },
    {
      header: t('common.status'),
      render: (admin) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
            admin.active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-100 text-gray-700 ring-gray-200'
          }`}
        >
          {admin.active ? t('common.active') : t('common.inactive')}
        </span>
      ),
    },
    { header: t('common.created'), render: (admin) => formatDate(admin.createdAt, undefined, locale) },
    {
      header: '',
      render: (admin) => (
        <button type="button" className="btn-secondary h-9 px-3" onClick={() => startEdit(admin)}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
          {t('common.edit')}
        </button>
      ),
    },
  ];

  if (!canManageAdmins) {
    return (
      <div className="panel p-6">
        <h1 className="page-title">{t('admins.title')}</h1>
        <p className="page-subtitle mt-2">{t('admins.forbidden')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('admins.title')}</h1>
        <p className="page-subtitle">{t('admins.subtitle')}</p>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <form onSubmit={(event) => void handleSubmit(event)} className="panel grid gap-4 p-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        {editingAdmin ? (
          <div className="lg:col-span-4 flex items-center justify-between gap-3 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-brand-100">
            <span>
              {t('admins.editing')} <strong>{editingAdmin.fullName}</strong>
            </span>
            <button type="button" className="inline-flex items-center gap-2 font-semibold text-brand-700" onClick={cancelEdit}>
              <X className="h-4 w-4" aria-hidden="true" />
              {t('common.cancel')}
            </button>
          </div>
        ) : null}
        <label>
          <span className="label">{t('common.name')}</span>
          <input
            className="input"
            value={form.fullName}
            onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            required
          />
        </label>
        <label>
          <span className="label">{t('common.email')}</span>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
        </label>
        <label>
          <span className="label">{editingAdmin ? t('admins.newPasswordOptional') : t('common.password')}</span>
          <input
            className="input"
            type="password"
            minLength={12}
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required={!editingAdmin}
          />
        </label>
        <div className="flex flex-col gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              checked={editingAdmin?.isGlobalAdmin ? true : form.active}
              disabled={editingAdmin?.isGlobalAdmin}
              onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
            />
            {t('common.active')}
          </label>
          <button type="submit" className="btn-primary h-10" disabled={saving}>
            {editingAdmin ? <Pencil className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {saving ? t('common.saving') : editingAdmin ? t('admins.update') : t('admins.create')}
          </button>
        </div>
      </form>

      <label className="relative block w-full max-w-xl">
        <Search className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
        <input
          className="input ps-9"
          placeholder={t('admins.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      <DataTable
        data={filteredAdmins}
        columns={columns}
        getRowKey={(admin) => admin.uid}
        loading={loading}
        emptyTitle={t('admins.noAdmins')}
      />
    </div>
  );
}
