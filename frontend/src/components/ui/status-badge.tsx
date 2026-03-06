import { CheckCircle, Clock, LogOut, AlertCircle, XCircle, Laptop } from 'lucide-react';
import type { ReactElement, ElementType } from 'react';

export interface StatusBadgeProps {
  status: string | null;
  missingCheckout?: boolean;
}

type StatusConfig = {
  icon: ElementType;
  cls: string;
  label: string;
};

const STATUS_MAP: Record<string, StatusConfig> = {
  'on-time': {
    icon: CheckCircle,
    cls: 'bg-green-100 text-green-800',
    label: 'On Time',
  },
  'within-grace': {
    icon: Clock,
    cls: 'bg-yellow-100 text-yellow-800',
    label: 'Within Grace',
  },
  late: {
    icon: Clock,
    cls: 'bg-red-100 text-red-800',
    label: 'Late',
  },
  early: {
    icon: LogOut,
    cls: 'bg-orange-100 text-orange-800',
    label: 'Early Leave',
  },
  absent: {
    icon: XCircle,
    cls: 'bg-slate-100 text-slate-600',
    label: 'Absent',
  },
  absent_morning: {
    icon: XCircle,
    cls: 'bg-purple-100 text-purple-700',
    label: 'Absent Morning',
  },
  absent_afternoon: {
    icon: AlertCircle,
    cls: 'bg-amber-100 text-amber-700',
    label: 'Absent Afternoon',
  },
};

export function StatusBadge({ status, missingCheckout }: StatusBadgeProps): ReactElement | null {
  if (missingCheckout) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
        <AlertCircle className="w-3 h-3" />
        Missing Checkout
      </span>
    );
  }

  if (!status) return null;

  const config = STATUS_MAP[status];
  if (!config) return null;

  const { icon: Icon, cls, label } = config;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export function RemoteBadge(): ReactElement {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#4848e5]/10 text-[#4848e5]">
      <Laptop className="w-3 h-3" />
      Remote
    </span>
  );
}
