import { LogOut, Menu } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { profile, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-2 border-b border-gray-200 bg-white/95 px-3 py-2 backdrop-blur sm:px-4 lg:px-8">
      <button type="button" className="btn-secondary h-10 w-10 p-0 lg:hidden" onClick={onMenuClick} title={t('topbar.openMenu')}>
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="hidden lg:block">
        <p className="text-sm font-medium text-gray-500">{t('topbar.adminDashboard')}</p>
      </div>
      <div className="ms-auto flex min-w-0 items-center gap-2 sm:gap-3">
        <LanguageToggle />
        <div className="hidden min-w-0 text-end xs:block">
          <p className="truncate text-sm font-semibold text-gray-900">{profile?.fullName ?? t('common.admin')}</p>
          <p className="hidden truncate text-xs text-gray-500 sm:block">{profile?.email}</p>
        </div>
        <button type="button" className="btn-secondary h-10 w-10 p-0" onClick={logout} title={t('auth.signOut')}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
