import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'emerald' | 'blue' | 'amber' | 'rose' | 'violet' | 'gray';
}

const toneClasses: Record<NonNullable<StatCardProps['tone']>, string> = {
  emerald: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
  violet: 'bg-violet-50 text-violet-700',
  gray: 'bg-gray-100 text-gray-700',
};

export default function StatCard({ title, value, icon: Icon, tone = 'emerald' }: StatCardProps) {
  return (
    <div className="panel p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium leading-5 text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-950 sm:text-3xl">{value}</p>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-lg ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
