import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { TranslationKey } from '../i18n/translations';

const navItems = [
  { labelKey: 'nav.dashboard', to: '/', icon: LayoutDashboard },
  { labelKey: 'nav.requests', to: '/requests', icon: ClipboardList },
  { labelKey: 'nav.categories', to: '/categories', icon: Tags },
  { labelKey: 'nav.workers', to: '/workers', icon: BriefcaseBusiness },
  { labelKey: 'nav.clients', to: '/clients', icon: Users },
  { labelKey: 'nav.reports', to: '/reports', icon: BarChart3 },
  { labelKey: 'nav.settings', to: '/settings', icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { direction, t } = useLanguage();
  const { profile } = useAuth();
  const closedClass = direction === 'rtl' ? 'translate-x-full' : '-translate-x-full';
  const visibleNavItems = profile?.isGlobalAdmin
    ? [...navItems.slice(0, 5), { labelKey: 'nav.admins', to: '/admins', icon: ShieldCheck }, ...navItems.slice(5)]
    : navItems;

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-gray-950/30 lg:hidden ${open ? 'block' : 'hidden'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 start-0 z-40 flex w-72 transform flex-col border-e border-gray-200 bg-white transition lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : closedClass
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5">
          <div>
            <p className="text-lg font-semibold text-gray-950">Brikoli</p>
            <p className="text-xs font-medium uppercase text-brand-700">{t('common.admin')}</p>
          </div>
          <button type="button" className="btn-secondary h-9 w-9 p-0 lg:hidden" onClick={onClose} title={t('topbar.closeMenu')}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
                }`
              }
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {t(item.labelKey as TranslationKey)}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
