import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message?: string;
  action?: ReactNode;
}

export default function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-5 text-center sm:min-h-52 sm:p-8">
      <Inbox className="mb-3 h-10 w-10 text-gray-300" aria-hidden="true" />
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {message ? <p className="mt-1 max-w-md text-sm text-gray-500">{message}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
