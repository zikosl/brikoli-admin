import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileText,
  History,
  Image as ImageIcon,
  MapPin,
  RotateCcw,
  Save,
  Search,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { useLanguage } from '../context/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
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

type DetailsTab = 'overview' | 'worker' | 'timeline' | 'media' | 'notes';
type WorkerAvailabilityFilter = 'all' | 'available' | 'unavailable';
type WorkerMatchFilter = 'all' | 'city' | 'service';

const tabs: Array<{ id: DetailsTab; icon: typeof ClipboardList; labelKey: TranslationKey }> = [
  { id: 'overview', icon: ClipboardList, labelKey: 'requestDetails.tabOverview' },
  { id: 'worker', icon: Users, labelKey: 'requestDetails.tabWorker' },
  { id: 'timeline', icon: History, labelKey: 'requestDetails.tabTimeline' },
  { id: 'media', icon: ImageIcon, labelKey: 'requestDetails.tabMedia' },
  { id: 'notes', icon: FileText, labelKey: 'requestDetails.tabNotes' },
];

export default function RequestDetails() {
  const { locale, t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [workers, setWorkers] = useState<WorkerUser[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState<DetailsTab>('overview');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [workerSearch, setWorkerSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<WorkerAvailabilityFilter>('all');
  const [matchFilter, setMatchFilter] = useState<WorkerMatchFilter>('all');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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
      setSelectedWorkerId(requestData.assignedWorkerId ?? '');
      setAdminNotes(requestData.adminNotes ?? '');
      setAssignmentNote('');
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

  const selectedWorker = useMemo(
    () => workers.find((worker) => worker.uid === selectedWorkerId) ?? null,
    [workers, selectedWorkerId],
  );

  const currentWorker = useMemo(
    () => workers.find((worker) => worker.uid === request?.assignedWorkerId) ?? null,
    [workers, request?.assignedWorkerId],
  );

  const filteredWorkers = useMemo(() => {
    if (!request) {
      return workers;
    }

    const needle = workerSearch.trim().toLowerCase();

    const scoreWorker = (worker: WorkerUser) => {
      const sameCity = worker.city.toLowerCase() === request.city.toLowerCase();
      const sameService = worker.services.includes(request.serviceId);
      return (sameCity ? 4 : 0) + (sameService ? 4 : 0) + (worker.available ? 1 : 0) + worker.ratingAverage / 10;
    };

    return [...workers]
      .filter((worker) => {
        const serviceNames = worker.services.map((serviceId) => serviceNameById.get(serviceId) ?? serviceId).join(' ');
        const matchesSearch =
          !needle ||
          worker.fullName.toLowerCase().includes(needle) ||
          worker.phoneNumber.toLowerCase().includes(needle) ||
          worker.city.toLowerCase().includes(needle) ||
          serviceNames.toLowerCase().includes(needle);
        const matchesAvailability =
          availabilityFilter === 'all' ||
          (availabilityFilter === 'available' ? worker.available : !worker.available);
        const matchesSmartFilter =
          matchFilter === 'all' ||
          (matchFilter === 'city' && worker.city.toLowerCase() === request.city.toLowerCase()) ||
          (matchFilter === 'service' && worker.services.includes(request.serviceId));

        return matchesSearch && matchesAvailability && matchesSmartFilter;
      })
      .sort((a, b) => {
        if (a.uid === request.assignedWorkerId) return -1;
        if (b.uid === request.assignedWorkerId) return 1;
        return scoreWorker(b) - scoreWorker(a);
      });
  }, [availabilityFilter, matchFilter, request, serviceNameById, workerSearch, workers]);

  const isReassignment = Boolean(request?.assignedWorkerId && selectedWorkerId && selectedWorkerId !== request.assignedWorkerId);
  const isSameWorker = Boolean(request?.assignedWorkerId && selectedWorkerId === request.assignedWorkerId);
  const canAssign = Boolean(selectedWorker && !isSameWorker && (!isReassignment || assignmentNote.trim()));

  const refreshRequest = async () => {
    if (!id) {
      return;
    }

    const updated = await getRequestById(id);
    setRequest(updated);
    setAdminNotes(updated.adminNotes ?? '');
    setSelectedWorkerId(updated.assignedWorkerId ?? '');
    setAssignmentNote('');
  };

  const handleAssign = async () => {
    if (!id || !selectedWorker) {
      return;
    }

    if (isReassignment && !assignmentNote.trim()) {
      setActionError(t('requestDetails.reassignNoteRequired'));
      return;
    }

    setSaving(true);
    setActionError(null);

    try {
      await assignWorkerToRequest(id, selectedWorker, assignmentNote);
      await refreshRequest();
    } catch (assignError) {
      setActionError(assignError instanceof Error ? assignError.message : t('requestDetails.assignError'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: RequestStatus) => {
    if (!id) {
      return;
    }

    setSaving(true);
    setActionError(null);

    try {
      await updateRequestStatus(id, status);
      await refreshRequest();
    } catch (statusError) {
      setActionError(statusError instanceof Error ? statusError.message : t('requestDetails.statusError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!id) {
      return;
    }

    setSaving(true);
    setActionError(null);

    try {
      await updateRequest(id, { adminNotes });
      await refreshRequest();
    } catch (notesError) {
      setActionError(notesError instanceof Error ? notesError.message : t('requestDetails.notesError'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!id) {
      return;
    }

    setSaving(true);
    setActionError(null);

    try {
      await cancelRequest(id);
      await refreshRequest();
      setConfirmCancel(false);
    } catch (cancelError) {
      setActionError(cancelError instanceof Error ? cancelError.message : t('requestDetails.cancelError'));
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
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Link to="/requests" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t('requestDetails.back')}
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="page-title">{request.serviceName}</h1>
              <StatusBadge status={request.status} />
            </div>
            <p className="page-subtitle">
              {request.clientName} {request.clientPhone ? `- ${request.clientPhone}` : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="rounded-full bg-gray-100 px-2.5 py-1">{request.city}</span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1">
                {request.urgency === 'urgent' ? t('urgency.urgent') : t('urgency.normal')}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1">
                {request.source === 'telegram' ? 'Telegram' : 'App'}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[220px_auto] xl:min-w-[420px]">
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
            <button type="button" className="btn-danger self-end" onClick={() => setConfirmCancel(true)} disabled={saving}>
              <XCircle className="h-4 w-4" aria-hidden="true" />
              {t('requestDetails.cancel')}
            </button>
          </div>
        </div>
      </div>

      {actionError ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{actionError}</div> : null}

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-2 overflow-x-auto" aria-label="Request details">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium transition ${
                  active
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === 'overview' ? (
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="panel p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-950">{t('requestDetails.info')}</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoItem label={t('common.description')} value={request.description} />
              <InfoItem label={t('common.address')} value={request.address} />
              <InfoItem label={t('common.city')} value={request.city} />
              <InfoItem label={t('common.service')} value={request.serviceName} />
              <InfoItem label={t('requestDetails.preferredDate')} value={formatDate(request.preferredDate, undefined, locale)} />
              <InfoItem label={t('requestDetails.assignedWorker')} value={request.assignedWorkerName ?? t('common.unassigned')} />
              <InfoItem label={t('common.created')} value={formatDate(request.createdAt, undefined, locale)} />
              <InfoItem label={t('common.updated')} value={formatDate(request.updatedAt, undefined, locale)} />
            </dl>
            {request.location ? (
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-brand-700" aria-hidden="true" />
                {request.location.latitude}, {request.location.longitude}
              </div>
            ) : null}
          </div>

          <div className="panel p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-950">{t('requestDetails.currentAssignment')}</h2>
            {currentWorker || request.assignedWorkerName ? (
              <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-950">{currentWorker?.fullName ?? request.assignedWorkerName}</p>
                    <p className="text-sm text-gray-600">{currentWorker?.phoneNumber || t('common.phoneNumber')}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-brand-700" aria-hidden="true" />
                </div>
                {currentWorker ? (
                  <div className="mt-4 grid gap-2 text-sm text-gray-700">
                    <p>{t('requestDetails.cityLine', { city: currentWorker.city || t('common.notSet') })}</p>
                    <p>{t('requestDetails.ratingLine', { availability: currentWorker.available ? t('common.available') : t('common.unavailable'), rating: currentWorker.ratingAverage.toFixed(1) })}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState title={t('common.unassigned')} />
            )}
          </div>
        </section>
      ) : null}

      {activeTab === 'worker' ? (
        <section className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <div className="panel p-5">
            <h2 className="text-lg font-semibold text-gray-950">{t('requestDetails.assignWorker')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('requestDetails.workerPickerHint')}</p>

            <div className="mt-5 space-y-4">
              <label className="space-y-2">
                <span className="label">{t('requestDetails.workerSearch')}</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <input
                    className="input ps-9"
                    value={workerSearch}
                    onChange={(event) => setWorkerSearch(event.target.value)}
                    placeholder={t('workers.search')}
                  />
                </div>
              </label>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <label className="space-y-2">
                  <span className="label">{t('requestDetails.availabilityFilter')}</span>
                  <select className="input" value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value as WorkerAvailabilityFilter)}>
                    <option value="all">{t('requestDetails.allWorkers')}</option>
                    <option value="available">{t('common.available')}</option>
                    <option value="unavailable">{t('common.unavailable')}</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="label">{t('requestDetails.matchFilter')}</span>
                  <select className="input" value={matchFilter} onChange={(event) => setMatchFilter(event.target.value as WorkerMatchFilter)}>
                    <option value="all">{t('requestDetails.allMatches')}</option>
                    <option value="city">{t('requestDetails.cityMatch')}</option>
                    <option value="service">{t('requestDetails.serviceMatch')}</option>
                  </select>
                </label>
              </div>

              <label className="space-y-2">
                <span className="label">
                  {isReassignment ? t('requestDetails.reassignNote') : t('requestDetails.assignNote')}
                </span>
                <textarea
                  className="input min-h-28"
                  value={assignmentNote}
                  onChange={(event) => setAssignmentNote(event.target.value)}
                  placeholder={isReassignment ? t('requestDetails.reassignNotePlaceholder') : t('requestDetails.assignNotePlaceholder')}
                />
              </label>

              <button type="button" className="btn-primary w-full" onClick={() => void handleAssign()} disabled={!canAssign || saving}>
                {isReassignment ? <RotateCcw className="h-4 w-4" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
                {isReassignment ? t('requestDetails.reassign') : t('requestDetails.assign')}
              </button>
            </div>
          </div>

          <div className="panel p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-950">{t('common.workers')}</h2>
                <p className="text-sm text-gray-500">{t('requestDetails.workerCount', { count: filteredWorkers.length })}</p>
              </div>
            </div>

            {filteredWorkers.length === 0 ? (
              <EmptyState title={t('requestDetails.noActiveWorkers')} />
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {filteredWorkers.map((worker) => {
                  const selected = selectedWorkerId === worker.uid;
                  const assigned = request.assignedWorkerId === worker.uid;
                  const serviceNames = worker.services.map((serviceId) => serviceNameById.get(serviceId) ?? serviceId);
                  const cityMatch = worker.city.toLowerCase() === request.city.toLowerCase();
                  const serviceMatch = worker.services.includes(request.serviceId);

                  return (
                    <button
                      type="button"
                      key={worker.uid}
                      className={`w-full rounded-lg border p-4 text-start transition ${
                        assigned
                          ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100'
                          : selected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedWorkerId(worker.uid)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-950">{worker.fullName}</p>
                          <p className="text-sm text-gray-500">{worker.phoneNumber || worker.email}</p>
                        </div>
                        {assigned ? (
                          <span className="rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white">{t('requestDetails.current')}</span>
                        ) : selected ? (
                          <CheckCircle2 className="h-5 w-5 text-blue-700" aria-hidden="true" />
                        ) : null}
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-gray-600">
                        <p>{t('requestDetails.cityLine', { city: worker.city || t('common.notSet') })}</p>
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
                        {cityMatch ? <MatchPill>{t('requestDetails.cityMatch')}</MatchPill> : null}
                        {serviceMatch ? <MatchPill>{t('requestDetails.serviceMatch')}</MatchPill> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === 'timeline' ? (
        <section className="panel p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-950">{t('requestDetails.assignmentTimeline')}</h2>
          {request.assignmentHistory.length === 0 ? (
            <EmptyState title={t('requestDetails.noAssignmentHistory')} />
          ) : (
            <div className="space-y-4">
              {request.assignmentHistory.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-950">
                        {entry.previousWorker
                          ? t('requestDetails.reassignedFromTo', {
                              from: entry.previousWorker.fullName,
                              to: entry.worker?.fullName ?? t('common.worker'),
                            })
                          : t('requestDetails.assignedTo', { worker: entry.worker?.fullName ?? t('common.worker') })}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {t('requestDetails.assignedBy', {
                          admin: entry.assignedBy?.fullName ?? entry.assignedBy?.email ?? t('common.admin'),
                        })}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(entry.createdAt, undefined, locale)}</span>
                  </div>
                  {entry.note ? <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{entry.note}</p> : null}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === 'media' ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <MediaPanel title={t('requestDetails.images')} emptyTitle={t('requestDetails.noImages')} images={request.images} />
          <MediaPanel title={t('requestDetails.completionImages')} emptyTitle={t('requestDetails.noCompletionImages')} images={request.completionImages} />
        </section>
      ) : null}

      {activeTab === 'notes' ? (
        <section className="panel p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-950">{t('requestDetails.notesCompletion')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">{t('requestDetails.workerNotes')}</p>
              <p className="mt-2 min-h-32 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                {request.workerNotes || t('requestDetails.noWorkerNotes')}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500">{t('requestDetails.adminNotes')}</label>
              <textarea
                className="input mt-2 min-h-32"
                value={adminNotes}
                onChange={(event) => setAdminNotes(event.target.value)}
              />
              <button type="button" className="btn-primary mt-3 w-full sm:w-auto" onClick={() => void handleSaveNotes()} disabled={saving}>
                <Save className="h-4 w-4" aria-hidden="true" />
                {t('requestDetails.saveNotes')}
              </button>
            </div>
          </div>
        </section>
      ) : null}

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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || '-'}</dd>
    </div>
  );
}

function MatchPill({ children }: { children: string }) {
  return <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{children}</span>;
}

function MediaPanel({ title, emptyTitle, images }: { title: string; emptyTitle: string; images: string[] }) {
  return (
    <div className="panel p-5">
      <h2 className="mb-4 text-lg font-semibold text-gray-950">{title}</h2>
      {images.length === 0 ? (
        <EmptyState title={emptyTitle} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {images.map((image) => (
            <img key={image} src={image} alt="" className="aspect-video rounded-lg object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}
