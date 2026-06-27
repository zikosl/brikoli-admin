import type { RequestStatus } from '../types/request';
import { REQUEST_STATUS_CLASSES, REQUEST_STATUS_LABELS } from '../utils/constants';
import { useLanguage } from '../context/LanguageContext';

export default function StatusBadge({ status }: { status: RequestStatus }) {
  const { t } = useLanguage();

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${REQUEST_STATUS_CLASSES[status]}`}>
      {t(REQUEST_STATUS_LABELS[status])}
    </span>
  );
}
