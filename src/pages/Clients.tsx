import { Power, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DataTable, { type TableColumn } from '../components/DataTable';
import { useLanguage } from '../context/LanguageContext';
import { getRequests } from '../services/requestService';
import { getClients, toggleUserActive } from '../services/userService';
import type { ServiceRequest } from '../types/request';
import type { ClientUser } from '../types/user';
import { formatDate } from '../utils/formatDate';

export default function Clients() {
  const { locale, t } = useLanguage();
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [clientsData, requestsData] = await Promise.all([getClients(), getRequests()]);
      setClients(clientsData);
      setRequests(requestsData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('clients.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const requestCountByClient = useMemo(() => {
    const counts = new Map<string, number>();

    requests.forEach((request) => {
      counts.set(request.clientId, (counts.get(request.clientId) ?? 0) + 1);
    });

    return counts;
  }, [requests]);

  const filteredClients = useMemo(() => {
    const needle = search.trim().toLowerCase();

    if (!needle) {
      return clients;
    }

    return clients.filter((client) =>
      [client.fullName, client.email, client.phoneNumber, client.city].some((value) => value.toLowerCase().includes(needle)),
    );
  }, [clients, search]);

  const handleToggle = async (client: ClientUser) => {
    await toggleUserActive(client.uid, !client.active);
    setClients((current) =>
      current.map((item) => (item.uid === client.uid ? { ...item, active: !client.active } : item)),
    );
  };

  const columns: Array<TableColumn<ClientUser>> = [
    {
      header: t('nav.clients'),
      render: (client) => (
        <div className="flex items-center gap-3">
          {client.profileImage ? (
            <img src={client.profileImage} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
              {client.fullName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-950">{client.fullName}</p>
            <p className="text-xs text-gray-500">{client.email}</p>
          </div>
        </div>
      ),
    },
    { header: t('common.phone'), render: (client) => client.phoneNumber },
    {
      header: t('common.address'),
      render: (client) => (
        <div>
          <p className="text-gray-950">{client.city}</p>
          <p className="max-w-xs text-xs text-gray-500">{client.address}</p>
        </div>
      ),
    },
    { header: t('common.requests'), render: (client) => requestCountByClient.get(client.uid) ?? 0 },
    {
      header: t('common.status'),
      render: (client) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
            client.active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-100 text-gray-700 ring-gray-200'
          }`}
        >
            {client.active ? t('common.active') : t('common.inactive')}
        </span>
      ),
    },
    { header: t('common.created'), render: (client) => formatDate(client.createdAt, undefined, locale) },
    {
      header: t('common.actions'),
      className: 'text-end',
      render: (client) => (
        <button
          type="button"
          className="btn-secondary h-9 w-9 p-0"
          onClick={() => void handleToggle(client)}
          title={client.active ? t('clients.deactivate') : t('clients.activate')}
        >
          <Power className="h-4 w-4" aria-hidden="true" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('clients.title')}</h1>
        <p className="page-subtitle">{t('clients.subtitle')}</p>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <label className="relative block w-full max-w-xl">
        <Search className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
        <input
          className="input ps-9"
          placeholder={t('clients.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      <DataTable
        data={filteredClients}
        columns={columns}
        getRowKey={(client) => client.uid}
        loading={loading}
        emptyTitle={t('clients.noClients')}
      />
    </div>
  );
}
