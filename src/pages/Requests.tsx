import { Eye } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable, { type TableColumn } from '../components/DataTable';
import RequestFilters from '../components/RequestFilters';
import StatusBadge from '../components/StatusBadge';
import { useLanguage } from '../context/LanguageContext';
import { getRequests } from '../services/requestService';
import { subscribeToRealtime } from '../services/realtimeService';
import type { RequestFiltersState, ServiceRequest } from '../types/request';
import { formatDate } from '../utils/formatDate';

const initialFilters: RequestFiltersState = {
  search: '',
  status: 'all',
  city: '',
  urgentOnly: false,
};

const REQUEST_REFRESH_INTERVAL_MS = 7000;

const createdAtMillis = (request: ServiceRequest) => {
  if (!request.createdAt) {
    return 0;
  }

  return new Date(request.createdAt).getTime() || 0;
};

export default function Requests() {
  const { locale, t } = useLanguage();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filters, setFilters] = useState<RequestFiltersState>(initialFilters);
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
        const requestsData = await getRequests();
        if (active) {
          setRequests(requestsData);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : t('requests.loadError'));
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
    }, REQUEST_REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      unsubscribeRealtime();
      window.clearInterval(timer);
    };
  }, [t]);

  const cities = useMemo(
    () => [...new Set(requests.map((request) => request.city).filter(Boolean))].sort(),
    [requests],
  );

  const filteredRequests = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();

    return [...requests]
      .sort((a, b) => createdAtMillis(b) - createdAtMillis(a))
      .filter((request) => {
        const matchesSearch =
          !needle ||
          request.clientName.toLowerCase().includes(needle) ||
          request.clientPhone.toLowerCase().includes(needle);
        const matchesStatus = filters.status === 'all' || request.status === filters.status;
        const matchesCity = !filters.city || request.city === filters.city;
        const matchesUrgency = !filters.urgentOnly || request.urgency === 'urgent';

        return matchesSearch && matchesStatus && matchesCity && matchesUrgency;
      });
  }, [requests, filters]);

  const columns: Array<TableColumn<ServiceRequest>> = [
    {
      header: t('nav.clients'),
      render: (request) => (
        <div>
          <p className="font-medium text-gray-950">{request.clientName}</p>
          <p className="text-xs text-gray-500">{request.clientPhone}</p>
        </div>
      ),
    },
    { header: t('common.service'), render: (request) => request.serviceName },
    { header: t('common.city'), render: (request) => request.city },
    {
      header: t('common.urgency'),
      render: (request) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
            request.urgency === 'urgent'
              ? 'bg-amber-50 text-amber-700 ring-amber-200'
              : 'bg-gray-100 text-gray-700 ring-gray-200'
          }`}
        >
          {request.urgency === 'urgent' ? t('urgency.urgent') : t('urgency.normal')}
        </span>
      ),
    },
    { header: t('common.status'), render: (request) => <StatusBadge status={request.status} /> },
    { header: t('common.worker'), render: (request) => request.assignedWorkerName ?? t('common.unassigned') },
    { header: t('common.created'), render: (request) => formatDate(request.createdAt, undefined, locale) },
    {
      header: t('requests.action'),
      className: 'text-end',
      render: (request) => (
        <Link className="btn-secondary h-9 w-9 p-0" to={`/requests/${request.id}`} title={t('requests.view')}>
          <Eye className="h-4 w-4" aria-hidden="true" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('requests.title')}</h1>
        <p className="page-subtitle">{t('requests.subtitle')}</p>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <RequestFilters filters={filters} cities={cities} onChange={setFilters} />

      <DataTable
        data={filteredRequests}
        columns={columns}
        getRowKey={(request) => request.id}
        loading={loading}
        emptyTitle={t('requests.noRequests')}
      />
    </div>
  );
}
