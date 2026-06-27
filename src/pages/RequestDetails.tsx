import { ArrowLeft, CheckCircle2, MapPin, Save, UserPlus, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { useLanguage } from '../context/LanguageContext';
import {
  assignWorkerToRequest,
  cancelRequest,
  getRequestById,
  updateRequest,
  updateRequestStatus,
} from '../services/requestService';
import { getServices } from '../services/serviceService';
import { getWorkers } from '../services/userService';
import type { RequestStatus, ServiceRequest } from '../types/request';
import type { Service } from '../types/service';
import type { WorkerUser } from '../types/user';
import { REQUEST_STATUS_OPTIONS } from '../utils/constants';
import { formatDate } from '../utils/formatDate';

export default function RequestDetails() {
  const { locale, t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [workers, setWorkers] = useState<WorkerUser[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = async () => {
    if (!id) {
      setError(t('requestDetails.idMissing'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [requestData, workersData, servicesData] = await Promise.all([getRequestById(id), getWorkers(), getServices()]);
      setRequest(requestData);
      setWorkers(workersData.filter((worker) => worker.active));
      setServices(servicesData);
      setSelectedWorkerId(requestData?.assignedWorkerId ?? '');
      setAdminNotes(requestData?.adminNotes ?? '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('requestDetails.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const serviceNameById = useMemo(
    () => new Map(services.map((service) => [service.id, service.name])),
    [services],
  );

  const sortedWorkers = useMemo(() => {
    if (!request) {
      return workers;
    }

    const scoreWorker = (worker: WorkerUser) => {
      const sameCity = worker.city.toLowerCase() === request.city.toLowerCase();
      const sameService = worker.services.includes(request.serviceId);
      return (sameCity ? 4 : 0) + (sameService ? 4 : 0) + (worker.available ? 1 : 0) + worker.ratingAverage / 10;
    };

    return [...workers].sort((a, b) => scoreWorker(b) - scoreWorker(a));
  }, [workers, request]);

  const selectedWorker = useMemo(
    () => sortedWorkers.find((worker) => worker.uid === selectedWorkerId) ?? null,
    [sortedWorkers, selectedWorkerId],
  );

  const refreshRequest = async () => {
    if (!id) {
      return;
    }

    const updated = await getRequestById(id);
    setRequest(updated);
    setAdminNotes(updated?.adminNotes ?? '');
    setSelectedWorkerId(updated?.assignedWorkerId ?? '');
  };

  const handleAssign = async () => {
    if (!id || !selectedWorker) {
      return;
    }

    setSaving(true);

    try {
      await assignWorkerToRequest(id, selectedWorker);
      await refreshRequest();
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: RequestStatus) => {
    if (!id) {
      return;
    }

    setSaving(true);

    try {
      await updateRequestStatus(id, status);
      await refreshRequest();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!id) {
      return;
    }

    setSaving(true);

    try {
      await updateRequest(id, { adminNotes });
      await refreshRequest();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!id) {
      return;
    }

    setSaving(true);

    try {
      await cancelRequest(id);
      await refreshRequest();
      setConfirmCancel(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label={t('common.loading')} />;
  }

  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  if (!request) {
    return <EmptyState title={t('requestDetails.notFound')} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/requests" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('requestDetails.back')}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title">{request.serviceName}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="page-subtitle">{request.clientName} - {request.clientPhone}</p>
        </div>
        <button type="button" className="btn-danger w-full sm:w-auto" onClick={() => setConfirmCancel(true)} disabled={saving}>
          <XCircle className="h-4 w-4" aria-hidden="true" />
          {t('requestDetails.cancel')}
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div className="panel p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-950">{t('requestDetails.info')}</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">{t('common.description')}</dt>
                <dd className="mt-1 text-sm text-gray-900">{request.description}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">{t('common.address')}</dt>
                <dd className="mt-1 text-sm text-gray-900">{request.address}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">{t('common.city')}</dt>
                <dd className="mt-1 text-sm text-gray-900">{request.city}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">{t('common.urgency')}</dt>
                <dd className="mt-1 text-sm capitalize text-gray-900">
                  {request.urgency === 'urgent' ? t('urgency.urgent') : t('urgency.normal')}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">{t('requestDetails.preferredDate')}</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(request.preferredDate, undefined, locale)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">{t('requestDetails.assignedWorker')}</dt>
                <dd className="mt-1 text-sm text-gray-900">{request.assignedWorkerName ?? t('common.unassigned')}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">{t('common.created')}</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(request.createdAt, undefined, locale)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">{t('common.updated')}</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(request.updatedAt, undefined, locale)}</dd>
              </div>
            </dl>
            {request.location ? (
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-brand-700" aria-hidden="true" />
                {request.location.latitude}, {request.location.longitude}
              </div>
            ) : null}
          </div>

          <div className="panel p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-950">{t('requestDetails.images')}</h2>
            {request.images.length === 0 ? (
              <EmptyState title={t('requestDetails.noImages')} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {request.images.map((image) => (
                  <img key={image} src={image} alt="" className="aspect-video rounded-lg object-cover" />
                ))}
              </div>
            )}
          </div>

          <div className="panel p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-950">{t('requestDetails.notesCompletion')}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">{t('requestDetails.workerNotes')}</p>
                <p className="mt-2 min-h-24 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                  {request.workerNotes || t('requestDetails.noWorkerNotes')}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">{t('requestDetails.adminNotes')}</label>
                <textarea
                  className="input mt-2 min-h-24"
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                />
                <button type="button" className="btn-primary mt-3 w-full sm:w-auto" onClick={() => void handleSaveNotes()} disabled={saving}>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {t('requestDetails.saveNotes')}
                </button>
              </div>
            </div>
            {request.completionImages.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {request.completionImages.map((image) => (
                  <img key={image} src={image} alt="" className="aspect-video rounded-lg object-cover" />
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="panel p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-950">{t('common.status')}</h2>
            <label className="space-y-2">
              <span className="label">{t('requestDetails.manualStatus')}</span>
              <select
                className="input"
                value={request.status}
                onChange={(event) => void handleStatusChange(event.target.value as RequestStatus)}
                disabled={saving}
              >
                {REQUEST_STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {t(status.labelKey)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="panel p-5">
            <div className="mb-4 flex flex-col gap-3 xs:flex-row xs:items-center xs:justify-between">
              <h2 className="text-lg font-semibold text-gray-950">{t('requestDetails.assignWorker')}</h2>
              <button type="button" className="btn-primary w-full xs:w-auto" onClick={() => void handleAssign()} disabled={!selectedWorker || saving}>
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                {t('requestDetails.assign')}
              </button>
            </div>
            {sortedWorkers.length === 0 ? (
              <EmptyState title={t('requestDetails.noActiveWorkers')} />
            ) : (
              <div className="space-y-3">
                {sortedWorkers.map((worker) => {
                  const selected = selectedWorkerId === worker.uid;
                  const serviceNames = worker.services.map((serviceId) => serviceNameById.get(serviceId) ?? serviceId);
                  const cityMatch = worker.city.toLowerCase() === request.city.toLowerCase();
                  const serviceMatch = worker.services.includes(request.serviceId);

                  return (
                    <button
                      type="button"
                      key={worker.uid}
                      className={`w-full rounded-lg border p-4 text-start transition ${
                        selected ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedWorkerId(worker.uid)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-950">{worker.fullName}</p>
                          <p className="text-sm text-gray-500">{worker.phoneNumber}</p>
                        </div>
                        {selected ? <CheckCircle2 className="h-5 w-5 text-brand-700" aria-hidden="true" /> : null}
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-gray-600">
                        <p>{t('requestDetails.cityLine', { city: worker.city })}</p>
                        <p>
                          {t('requestDetails.servicesLine', {
                            services: serviceNames.length > 0 ? serviceNames.join(', ') : t('common.none'),
                          })}
                        </p>
                        <p>
                          {t('requestDetails.ratingLine', {
                            availability: worker.available ? t('common.available') : t('common.unavailable'),
                            rating: worker.ratingAverage.toFixed(1),
                          })}
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {cityMatch ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{t('requestDetails.cityMatch')}</span>
                        ) : null}
                        {serviceMatch ? (
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">{t('requestDetails.serviceMatch')}</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title={t('requestDetails.cancelTitle')}
        message={t('requestDetails.cancelMessage')}
        confirmLabel={t('requestDetails.cancel')}
        loading={saving}
        onConfirm={() => void handleCancel()}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
