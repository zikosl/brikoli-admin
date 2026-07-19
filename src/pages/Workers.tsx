import { Edit, Plus, Power, Search, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DataTable, { type TableColumn } from '../components/DataTable';
import WorkerFormModal from '../components/WorkerFormModal';
import { useLanguage } from '../context/LanguageContext';
import { getCategories } from '../services/categoryService';
import { createWorkerProfile, getWorkers, toggleUserActive, updateUser } from '../services/userService';
import type { Category } from '../types/category';
import type { WorkerProfileFormValues, WorkerUser } from '../types/user';
import { formatDate } from '../utils/formatDate';

export default function Workers() {
  const { locale, t } = useLanguage();
  const [workers, setWorkers] = useState<WorkerUser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerUser | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [workersData, categoriesData] = await Promise.all([getWorkers(), getCategories(true)]);
      setWorkers(workersData);
      setCategories(categoriesData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('workers.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const serviceNameById = useMemo(() => {
    const entries = categories.flatMap((category) => [
      [category.id, category.title] as const,
      ...category.subCategories.map((subCategory) => [subCategory.id, subCategory.title] as const),
    ]);
    return new Map(entries);
  }, [categories]);

  const filteredWorkers = useMemo(() => {
    const needle = search.trim().toLowerCase();

    if (!needle) {
      return workers;
    }

    return workers.filter((worker) =>
      [worker.fullName, worker.email, worker.phoneNumber, worker.city].some((value) => value.toLowerCase().includes(needle)),
    );
  }, [workers, search]);

  const handleSubmit = async (values: WorkerProfileFormValues) => {
    if (selectedWorker) {
      await updateUser(selectedWorker.uid, values);
    } else {
      await createWorkerProfile(values);
    }

    setModalOpen(false);
    await load();
  };

  const openCreate = () => {
    setSelectedWorker(null);
    setModalOpen(true);
  };

  const openEdit = (worker: WorkerUser) => {
    setSelectedWorker(worker);
    setModalOpen(true);
  };

  const handleToggle = async (worker: WorkerUser) => {
    await toggleUserActive(worker.uid, !worker.active);
    setWorkers((current) =>
      current.map((item) => (item.uid === worker.uid ? { ...item, active: !worker.active } : item)),
    );
  };

  const columns: Array<TableColumn<WorkerUser>> = [
    {
      header: t('common.worker'),
      render: (worker) => (
        <div className="flex items-center gap-3">
          {worker.profileImage ? (
            <img src={worker.profileImage} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
              {worker.fullName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-950">{worker.fullName}</p>
            <p className="text-xs text-gray-500">{worker.email}</p>
          </div>
        </div>
      ),
    },
    { header: t('common.phone'), render: (worker) => worker.phoneNumber },
    { header: t('common.city'), render: (worker) => worker.city },
    {
      header: t('common.services'),
      render: (worker) => (
        <div className="flex max-w-sm flex-wrap gap-1">
          {[...worker.categoryIds, ...worker.subCategoryIds].length > 0 ? (
            [...worker.categoryIds, ...worker.subCategoryIds].map((serviceId) => (
              <span key={serviceId} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                {serviceNameById.get(serviceId) ?? serviceId}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">{t('common.none')}</span>
          )}
        </div>
      ),
    },
    {
      header: t('common.status'),
      render: (worker) => (
        <div className="space-y-1">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
              worker.active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-100 text-gray-700 ring-gray-200'
            }`}
          >
            {worker.active ? t('common.active') : t('common.inactive')}
          </span>
          <p className="text-xs text-gray-500">{worker.available ? t('common.available') : t('common.unavailable')}</p>
        </div>
      ),
    },
    {
      header: t('workers.performance'),
      render: (worker) => (
        <div className="space-y-1">
          <p className="flex items-center gap-1 font-medium text-gray-950">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
            {worker.ratingAverage.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">{t('workers.completedCount', { count: worker.completedJobs })}</p>
        </div>
      ),
    },
    { header: t('common.created'), render: (worker) => formatDate(worker.createdAt, undefined, locale) },
    {
      header: t('common.actions'),
      className: 'text-end',
      render: (worker) => (
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary h-9 w-9 p-0" onClick={() => openEdit(worker)} title={t('workers.editWorker')}>
            <Edit className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn-secondary h-9 w-9 p-0"
            onClick={() => void handleToggle(worker)}
            title={worker.active ? t('workers.deactivate') : t('workers.activate')}
          >
            <Power className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">{t('workers.title')}</h1>
          <p className="page-subtitle">{t('workers.subtitle')}</p>
        </div>
        <button type="button" className="btn-primary w-full sm:w-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('workers.new')}
        </button>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <label className="relative block w-full max-w-xl">
        <Search className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
        <input
          className="input ps-9"
          placeholder={t('workers.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      <DataTable
        data={filteredWorkers}
        columns={columns}
        getRowKey={(worker) => worker.uid}
        loading={loading}
        emptyTitle={t('workers.noWorkers')}
      />

      <WorkerFormModal
        open={modalOpen}
        worker={selectedWorker}
        categories={categories}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
