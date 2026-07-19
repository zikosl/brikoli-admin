import { Filter, Search, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { RequestFiltersState } from '../types/request';
import { REQUEST_STATUS_OPTIONS } from '../utils/constants';

interface RequestFiltersProps {
  filters: RequestFiltersState;
  cities: string[];
  onChange: (filters: RequestFiltersState) => void;
}

const emptyFilters: RequestFiltersState = {
  search: '',
  status: 'all',
  city: '',
  urgentOnly: false,
};

export default function RequestFilters({ filters, cities, onChange }: RequestFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="panel p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
          <input
            className="input ps-9"
            placeholder={t('requests.search')}
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
          />
        </label>
        <label className="relative">
          <Filter className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
          <select
            className="input ps-9"
            value={filters.status}
            onChange={(event) => onChange({ ...filters, status: event.target.value as RequestFiltersState['status'] })}
          >
            <option value="all">{t('requests.allStatuses')}</option>
            {REQUEST_STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {t(status.labelKey)}
              </option>
            ))}
          </select>
        </label>
        <select className="input" value={filters.city} onChange={(event) => onChange({ ...filters, city: event.target.value })}>
          <option value="">{t('requests.allCities')}</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <label className="flex min-h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            checked={filters.urgentOnly}
            onChange={(event) => onChange({ ...filters, urgentOnly: event.target.checked })}
          />
          {t('common.urgent')}
        </label>
        <button type="button" className="btn-secondary w-full sm:col-span-2 lg:col-span-1" onClick={() => onChange(emptyFilters)} title={t('common.reset')}>
          <X className="h-4 w-4" aria-hidden="true" />
          {t('common.reset')}
        </button>
      </div>
    </div>
  );
}
