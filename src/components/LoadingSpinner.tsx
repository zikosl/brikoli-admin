import { useLanguage } from '../context/LanguageContext';

interface LoadingSpinnerProps {
  label?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ label, fullScreen = false }: LoadingSpinnerProps) {
  const { t } = useLanguage();
  const content = (
    <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
      <span>{label ?? t('common.loading')}</span>
    </div>
  );

  if (fullScreen) {
    return <div className="grid min-h-screen place-items-center bg-gray-50">{content}</div>;
  }

  return content;
}
