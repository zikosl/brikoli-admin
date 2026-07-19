import { AlertTriangle, ClipboardList, Star, UserCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import { useLanguage } from '../context/LanguageContext';
import { getRatings } from '../services/ratingService';
import { getRequests } from '../services/requestService';
import { getWorkers } from '../services/userService';
import type { Rating } from '../types/rating';
import type { ServiceRequest } from '../types/request';
import type { WorkerUser } from '../types/user';
import { CHART_COLORS, REQUEST_STATUS_OPTIONS } from '../utils/constants';

interface CountDatum {
  name: string;
  count: number;
}

interface RatingDatum {
  worker: string;
  average: number;
  count: number;
}

const chartHeight = 300;

const countBy = (items: ServiceRequest[], getKey: (item: ServiceRequest) => string, unknownLabel: string): CountDatum[] => {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const key = getKey(item) || unknownLabel;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};

export default function Reports() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [workers, setWorkers] = useState<WorkerUser[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [requestsData, workersData, ratingsData] = await Promise.all([
          getRequests(),
          getWorkers(),
          getRatings(),
        ]);
        setRequests(requestsData);
        setWorkers(workersData);
        setRatings(ratingsData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : t('reports.loadError'));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const workerNameById = useMemo(
    () => new Map(workers.map((worker) => [worker.uid, worker.fullName])),
    [workers],
  );

  const requestsByStatus = useMemo(
    () =>
      REQUEST_STATUS_OPTIONS.map((status) => ({
        name: t(status.labelKey),
        count: requests.filter((request) => request.status === status.value).length,
      })),
    [requests, t],
  );

  const requestsByService = useMemo(
    () => countBy(requests, (request) => request.serviceName, t('reports.unknown')),
    [requests, t],
  );

  const requestsByCity = useMemo(() => countBy(requests, (request) => request.city, t('reports.unknown')), [requests, t]);

  const completedByWorker = useMemo(
    () =>
      countBy(
        requests.filter((request) => request.status === 'completed'),
        (request) => request.assignedWorkerName ?? workerNameById.get(request.assignedWorkerId ?? '') ?? t('common.unassigned'),
        t('reports.unknown'),
      ),
    [requests, workerNameById, t],
  );

  const averageRatingByWorker = useMemo<RatingDatum[]>(() => {
    const totals = new Map<string, { total: number; count: number }>();

    ratings.forEach((rating) => {
      const current = totals.get(rating.workerId) ?? { total: 0, count: 0 };
      totals.set(rating.workerId, { total: current.total + rating.rating, count: current.count + 1 });
    });

    return [...totals.entries()]
      .map(([workerId, summary]) => ({
        worker: workerNameById.get(workerId) ?? workerId,
        average: Number((summary.total / summary.count).toFixed(2)),
        count: summary.count,
      }))
      .sort((a, b) => b.average - a.average);
  }, [ratings, workerNameById]);

  const cancellations = requests.filter((request) => request.status === 'cancelled').length;

  if (loading) {
    return <LoadingSpinner label={t('common.loading')} />;
  }

  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('reports.title')}</h1>
        <p className="page-subtitle">{t('reports.subtitle')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatCard title={t('reports.totalRequests')} value={requests.length} icon={ClipboardList} tone="blue" />
        <StatCard title={t('common.completed')} value={requests.filter((request) => request.status === 'completed').length} icon={UserCheck} />
        <StatCard title={t('reports.averageRatings')} value={averageRatingByWorker.length} icon={Star} tone="amber" />
        <StatCard title={t('reports.cancellations')} value={cancellations} icon={AlertTriangle} tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartPanel title={t('reports.requestsByStatus')}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie data={requestsByStatus} dataKey="count" nameKey="name" innerRadius={62} outerRadius={100} paddingAngle={2}>
                {requestsByStatus.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title={t('reports.requestsByService')}>
          <BarListChart data={requestsByService} emptyTitle={t('common.noData')} />
        </ChartPanel>

        <ChartPanel title={t('reports.requestsByCity')}>
          <BarListChart data={requestsByCity} emptyTitle={t('common.noData')} />
        </ChartPanel>

        <ChartPanel title={t('reports.completedByWorker')}>
          <BarListChart data={completedByWorker} emptyTitle={t('common.noData')} />
        </ChartPanel>
      </div>

      <section className="panel p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-950">{t('reports.averageRatingByWorker')}</h2>
        {averageRatingByWorker.length === 0 ? (
          <EmptyState title={t('reports.noRatings')} />
        ) : (
          <>
            <div className="divide-y divide-gray-100 md:hidden">
            {averageRatingByWorker.map((row) => (
              <div key={row.worker} className="space-y-3 py-3">
                <p className="font-medium text-gray-950">{row.worker}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">{t('common.average')}</p>
                    <p className="mt-1 text-gray-700">{row.average.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">{t('common.ratings')}</p>
                    <p className="mt-1 text-gray-700">{row.count}</p>
                  </div>
                </div>
              </div>
            ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-500">{t('common.worker')}</th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-500">{t('common.average')}</th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-gray-500">{t('common.ratings')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {averageRatingByWorker.map((row) => (
                  <tr key={row.worker}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-950">{row.worker}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.average.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel p-5">
      <h2 className="mb-4 text-lg font-semibold text-gray-950">{title}</h2>
      {children}
    </section>
  );
}

function BarListChart({ data, emptyTitle }: { data: CountDatum[]; emptyTitle: string }) {
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} />;
  }

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data.slice(0, 10)} margin={{ top: 10, right: 10, bottom: 50, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={78} tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
