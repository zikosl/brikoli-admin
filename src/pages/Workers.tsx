import { Edit, Plus, Power, Search, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DataTable, { type TableColumn } from '../components/DataTable';
import WorkerFormModal from '../components/WorkerFormModal';
import { useLanguage } from '../context/LanguageContext';
import { getServices } from '../services/serviceService';
import { createWorkerProfile, getWorkerInvites, getWorkers, toggleUserActive, updateUser } from '../services/userService';
import type { Service } from '../types/service';
import type { WorkerInvite, WorkerProfileFormValues, WorkerUser } from '../types/user';
import { formatDate } from '../utils/formatDate';

export default function Workers() {
  const { locale, t } = useLanguage();
  const [workers, setWorkers] = useState<WorkerUser[]>([]);
  const [workerInvites, setWorkerInvites] = useState<WorkerInvite[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerUser | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [workersData, invitesData, servicesData] = await Promise.all([getWorkers(), getWorkerInvites(), getServices()]);
      setWorkers(workersData);
      setWorkerInvites(invitesData);
      setServices(servicesData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('workers.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const serviceNameById = useMemo(
    () => new Map(services.map((service) => [service.id, service.name])),
    [services],
  );

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
          {worker.services.length > 0 ? (
            worker.services.map((serviceId) => (
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

  const inviteColumns: Array<TableColumn<WorkerInvite>> = [
    {
      header: t('common.worker'),
      render: (invite) => (
        <div>
          <p className="font-medium text-gray-950">{invite.fullName}</p>
          <p className="text-xs text-gray-500">{invite.email}</p>
        </div>
      ),
    },
    { header: t('common.phone'), render: (invite) => invite.phoneNumber },
    { header: t('common.city'), render: (invite) => invite.city },
    {
      header: t('common.services'),
      render: (invite) => (
        <div className="flex max-w-sm flex-wrap gap-1">
          {invite.services.length > 0 ? (
            invite.services.map((serviceId) => (
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
      render: () => (
        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
          {t('workers.pendingClaim')}
        </span>
      ),
    },
    { header: t('common.created'), render: (invite) => formatDate(invite.createdAt, undefined, locale) },
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

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        {t('workers.authPageNote')}
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

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-950">{t('workers.pendingInvites')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('workers.pendingInvitesSubtitle')}</p>
        </div>
        <DataTable
          data={workerInvites}
          columns={inviteColumns}
          getRowKey={(invite) => invite.id}
          loading={loading}
          emptyTitle={t('workers.noPendingInvites')}
        />
      </div>

      <WorkerFormModal
        open={modalOpen}
        worker={selectedWorker}
        services={services}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
