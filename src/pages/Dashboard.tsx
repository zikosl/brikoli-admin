import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Clock,
  Settings2,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { useLanguage } from '../context/LanguageContext';
import { getRatings } from '../services/ratingService';
import { getRequests } from '../services/requestService';
import { subscribeToRealtime } from '../services/realtimeService';
import { getUsers } from '../services/userService';
import type { Rating } from '../types/rating';
import type { ServiceRequest } from '../types/request';
import type { AppUser, ClientUser, WorkerUser } from '../types/user';
import { REQUEST_STATUS_OPTIONS } from '../utils/constants';
import { formatDate } from '../utils/formatDate';

const isClient = (user: AppUser): user is ClientUser => user.role === 'client';
const isWorker = (user: AppUser): user is WorkerUser => user.role === 'worker';
const DASHBOARD_REFRESH_INTERVAL_MS = 10000;

export default function Dashboard() {
  const { locale, t } = useLanguage();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      try {
        const [usersData, requestsData, ratingsData] = await Promise.all([
          getUsers(),
          getRequests(),
          getRatings(),
        ]);
        if (active) {
          setUsers(usersData);
          setRequests(requestsData);
          setRatings(ratingsData);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : t('dashboard.loadError'));
        }
      } finally {
        if (active && showLoading) {
          setLoading(false);
        }
      }
    };

    void load(true);
    const unsubscribeRealtime = subscribeToRealtime('request.changed', () => {
      void load();
    });
    const timer = window.setInterval(() => {
      void load();
    }, DASHBOARD_REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      unsubscribeRealtime();
      window.clearInterval(timer);
    };
  }, [t]);

  const clients = useMemo(() => users.filter(isClient), [users]);
  const workers = useMemo(() => users.filter(isWorker), [users]);

  const stats = useMemo(
    () => ({
      totalClients: clients.length,
      totalWorkers: workers.length,
      activeWorkers: workers.filter((worker) => worker.active).length,
      totalServices: new Set(requests.map((request) => request.subCategoryId ?? request.categoryId).filter(Boolean)).size,
      pendingRequests: requests.filter((request) => request.status === 'pending').length,
      assignedRequests: requests.filter((request) => request.status === 'assigned').length,
      completedRequests: requests.filter((request) => request.status === 'completed').length,
      cancelledRequests: requests.filter((request) => request.status === 'cancelled').length,
      urgentRequests: requests.filter((request) => request.urgency === 'urgent').length,
    }),
    [clients.length, workers, requests],
  );

  const statusChartData = useMemo(
    () =>
      REQUEST_STATUS_OPTIONS.map((status) => ({
        name: t(status.labelKey),
        count: requests.filter((request) => request.status === status.value).length,
      })),
    [requests, t],
  );

  const workerRatings = useMemo(() => {
    const totals = new Map<string, { total: number; count: number }>();

    ratings.forEach((rating) => {
      const current = totals.get(rating.workerId) ?? { total: 0, count: 0 };
      totals.set(rating.workerId, { total: current.total + rating.rating, count: current.count + 1 });
    });

    return totals;
  }, [ratings]);

  const topWorkers = useMemo(
    () =>
      [...workers]
        .sort((a, b) => b.completedJobs - a.completedJobs || b.ratingAverage - a.ratingAverage)
        .slice(0, 5)
        .map((worker) => {
          const ratingSummary = workerRatings.get(worker.uid);
          const average = ratingSummary ? ratingSummary.total / ratingSummary.count : worker.ratingAverage;
          return { ...worker, displayRating: average };
        }),
    [workers, workerRatings],
  );

  if (loading) {
    return <LoadingSpinner label={t('common.loading')} />;
  }

  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('dashboard.title')}</h1>
        <p className="page-subtitle">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        <StatCard title={t('dashboard.totalClients')} value={stats.totalClients} icon={Users} tone="blue" />
        <StatCard title={t('dashboard.totalWorkers')} value={stats.totalWorkers} icon={BriefcaseBusiness} tone="emerald" />
        <StatCard title={t('dashboard.activeWorkers')} value={stats.activeWorkers} icon={CheckCircle2} tone="emerald" />
        <StatCard title={t('dashboard.totalServices')} value={stats.totalServices} icon={Settings2} tone="violet" />
        <StatCard title={t('dashboard.pendingRequests')} value={stats.pendingRequests} icon={Clock} tone="amber" />
        <StatCard title={t('dashboard.assignedRequests')} value={stats.assignedRequests} icon={ClipboardList} tone="blue" />
        <StatCard title={t('dashboard.completedRequests')} value={stats.completedRequests} icon={CheckCircle2} tone="emerald" />
        <StatCard title={t('dashboard.cancelledRequests')} value={stats.cancelledRequests} icon={XCircle} tone="rose" />
        <StatCard title={t('dashboard.urgentRequests')} value={stats.urgentRequests} icon={AlertTriangle} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-950">{t('dashboard.latestRequests')}</h2>
          </div>
          {requests.length === 0 ? (
            <EmptyState title={t('dashboard.noRequestsYet')} />
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 6).map((request) => (
                <div key={request.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-950">{request.clientName}</p>
                      <p className="text-sm text-gray-500">
                        {t('dashboard.requestLocation', { service: request.serviceName, city: request.city })}
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{formatDate(request.createdAt, undefined, locale)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-brand-700" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-950">{t('dashboard.requestsByStatus')}</h2>
          </div>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 10, right: 6, bottom: 40, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={70} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="panel p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-950">{t('dashboard.workerPerformance')}</h2>
        {topWorkers.length === 0 ? (
          <EmptyState title={t('dashboard.noWorkersYet')} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {topWorkers.map((worker) => (
              <div key={worker.uid} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="font-medium text-gray-950">{worker.fullName}</p>
                <p className="mt-1 text-sm text-gray-500">{worker.city}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">{t('dashboard.jobs')}</p>
                    <p className="font-semibold text-gray-950">{worker.completedJobs}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{t('common.rating')}</p>
                    <p className="font-semibold text-gray-950">{worker.displayRating.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
