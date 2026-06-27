import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useLanguage();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-gray-950/40 px-3">
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-soft sm:p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onCancel} disabled={loading}>
            {cancelLabel ?? t('common.cancel')}
          </button>
          <button type="button" className="btn-danger w-full sm:w-auto" onClick={onConfirm} disabled={loading}>
            {loading ? t('common.working') : (confirmLabel ?? t('common.confirm'))}
          </button>
        </div>
      </div>
    </div>
  );
}
