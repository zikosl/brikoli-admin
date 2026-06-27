import type { ReactNode } from 'react';
import { useLanguage } from '../context/LanguageContext';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';

export interface TableColumn<T> {
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Array<TableColumn<T>>;
  getRowKey: (item: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
}

export default function DataTable<T>({
  data,
  columns,
  getRowKey,
  loading = false,
  emptyTitle,
  emptyMessage,
}: DataTableProps<T>) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="panel grid min-h-60 place-items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle ?? t('datatable.noRecords')} message={emptyMessage} />;
  }

  return (
    <div className="panel overflow-hidden">
      <div className="divide-y divide-gray-100 md:hidden">
        {data.map((item) => (
          <div key={getRowKey(item)} className="space-y-3 p-4">
            {columns.map((column, index) => (
              <div key={column.header} className={index === 0 ? '' : 'grid grid-cols-[7.5rem_1fr] gap-3'}>
                {index === 0 ? null : (
                  <p className="text-xs font-semibold uppercase text-gray-500">{column.header}</p>
                )}
                <div className={`text-sm text-gray-700 ${index === 0 ? '' : 'text-end'}`}>{column.render(item)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  scope="col"
                  className={`px-4 py-3 text-start text-xs font-semibold uppercase text-gray-500 ${column.className ?? ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.map((item) => (
              <tr key={getRowKey(item)} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.header} className={`px-4 py-3 text-sm text-gray-700 ${column.className ?? ''}`}>
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
