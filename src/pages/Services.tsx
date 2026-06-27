import { Edit, Plus, Power, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import DataTable, { type TableColumn } from '../components/DataTable';
import ServiceFormModal from '../components/ServiceFormModal';
import { useLanguage } from '../context/LanguageContext';
import {
  createService,
  deleteService,
  getServices,
  toggleServiceActive,
  updateService,
} from '../services/serviceService';
import { getSettings } from '../services/settingsService';
import { uploadImage } from '../services/storageService';
import type { Service, ServiceFormValues } from '../types/service';
import { formatDate } from '../utils/formatDate';

export default function Services() {
  const { locale, t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [servicesData, settingsData] = await Promise.all([getServices(), getSettings()]);
      setServices(servicesData);
      setCategories(settingsData.categories);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('services.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const categoryOptions = useMemo(
    () => [...new Set([...categories, ...services.map((service) => service.category).filter(Boolean)])].sort(),
    [categories, services],
  );

  const filteredServices = useMemo(() => {
    const needle = search.trim().toLowerCase();

    if (!needle) {
      return services;
    }

    return services.filter((service) =>
      [service.name, service.description, service.category].some((value) => value.toLowerCase().includes(needle)),
    );
  }, [services, search]);

  const openCreate = () => {
    setSelectedService(null);
    setModalOpen(true);
  };

  const openEdit = (service: Service) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  const handleSubmit = async (values: ServiceFormValues, file: File | null) => {
    const image = file ? await uploadImage(file, 'services') : values.image;
    const payload = { ...values, image };

    if (selectedService) {
      await updateService(selectedService.id, payload);
    } else {
      await createService(payload);
    }

    setModalOpen(false);
    await load();
  };

  const handleToggle = async (service: Service) => {
    await toggleServiceActive(service.id, !service.active);
    setServices((current) =>
      current.map((item) => (item.id === service.id ? { ...item, active: !service.active } : item)),
    );
  };

  const handleDelete = async () => {
    if (!serviceToDelete) {
      return;
    }

    setDeleting(true);

    try {
      await deleteService(serviceToDelete.id);
      setServices((current) => current.filter((service) => service.id !== serviceToDelete.id));
      setServiceToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const columns: Array<TableColumn<Service>> = [
    {
      header: t('common.service'),
      render: (service) => (
        <div className="flex items-center gap-3">
          {service.image ? (
            <img src={service.image} alt="" className="h-11 w-11 rounded-md object-cover" />
          ) : (
            <div className="grid h-11 w-11 place-items-center rounded-md bg-gray-100 text-gray-400">
              <span className="text-xs">IMG</span>
            </div>
          )}
          <div>
            <p className="font-medium text-gray-950">{service.name}</p>
            <p className="line-clamp-1 max-w-xs text-xs text-gray-500">{service.description}</p>
          </div>
        </div>
      ),
    },
    { header: t('common.category'), render: (service) => service.category },
    {
      header: t('common.status'),
      render: (service) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
            service.active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-100 text-gray-700 ring-gray-200'
          }`}
        >
            {service.active ? t('common.active') : t('common.inactive')}
        </span>
      ),
    },
    { header: t('common.created'), render: (service) => formatDate(service.createdAt, undefined, locale) },
    {
      header: t('common.actions'),
      className: 'text-end',
      render: (service) => (
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary h-9 w-9 p-0" onClick={() => openEdit(service)} title={t('services.editTitle')}>
            <Edit className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn-secondary h-9 w-9 p-0"
            onClick={() => void handleToggle(service)}
            title={service.active ? t('services.deactivate') : t('services.activate')}
          >
            <Power className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn-secondary h-9 w-9 p-0 text-red-600 hover:text-red-700"
            onClick={() => setServiceToDelete(service)}
            title={t('services.delete')}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">{t('services.title')}</h1>
          <p className="page-subtitle">{t('services.subtitle')}</p>
        </div>
        <button type="button" className="btn-primary w-full sm:w-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('services.new')}
        </button>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <label className="relative block w-full max-w-xl">
        <Search className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
        <input
          className="input ps-9"
          placeholder={t('services.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      <DataTable
        data={filteredServices}
        columns={columns}
        getRowKey={(service) => service.id}
        loading={loading}
        emptyTitle={t('services.noServices')}
      />

      <ServiceFormModal
        open={modalOpen}
        service={selectedService}
        categories={categoryOptions}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(serviceToDelete)}
        title={t('services.deleteTitle')}
        message={t('services.deleteMessage', { name: serviceToDelete?.name ?? t('services.thisService') })}
        confirmLabel={t('common.delete')}
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setServiceToDelete(null)}
      />
    </div>
  );
}
