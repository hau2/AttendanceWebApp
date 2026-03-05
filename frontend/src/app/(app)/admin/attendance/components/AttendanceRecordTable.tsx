'use client';

import { AttendanceRecordWithUser } from '@/lib/api/attendance';
import { User } from '@/lib/api/users';
import { StatusBadge, RemoteBadge } from '@/components/ui/status-badge';

interface Props {
  records: AttendanceRecordWithUser[];
  usersMap: Record<string, User>;
  onSelectRecord: (r: AttendanceRecordWithUser) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(isoStr: string | null): string {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function AttendanceRecordTable({ records, usersMap, onSelectRecord }: Props) {
  if (records.length === 0) {
    return <p className="text-gray-500 text-center py-10">No attendance records for this period.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-3 px-4 font-medium">Employee</th>
            <th className="pb-3 px-4 font-medium">Division</th>
            <th className="pb-3 px-4 font-medium">Manager</th>
            <th className="pb-3 px-4 font-medium">Date</th>
            <th className="pb-3 px-4 font-medium">Check-in</th>
            <th className="pb-3 px-4 font-medium">In Status</th>
            <th className="pb-3 px-4 font-medium">Remote</th>
            <th className="pb-3 px-4 font-medium">Notes</th>
            <th className="pb-3 px-4 font-medium">Check-out</th>
            <th className="pb-3 px-4 font-medium">Out Status</th>
            <th className="pb-3 px-4 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            const user = usersMap[r.user_id];
            const divisionName = user?.divisions?.name ?? '—';
            const managerName = user?.divisions?.users?.full_name ?? '—';
            return (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900 font-medium">
                  {r.users?.full_name || user?.full_name || 'Unknown'}
                </td>
                <td className="py-3 px-4 text-gray-600">{divisionName}</td>
                <td className="py-3 px-4 text-gray-600">{managerName}</td>
                <td className="py-3 px-4 text-gray-700">{formatDate(r.work_date)}</td>
                <td className="py-3 px-4 text-gray-700">{formatTime(r.check_in_at)}</td>
                <td className="py-3 px-4"><StatusBadge status={r.check_in_status} /></td>
                <td className="py-3 px-4">
                  {r.is_remote && <RemoteBadge />}
                </td>
                <td className="py-3 px-4 max-w-xs">
                  {r.late_reason && (
                    <p className="text-xs text-gray-600"><span className="font-medium">Late:</span> {r.late_reason}</p>
                  )}
                  {r.early_note && (
                    <p className="text-xs text-gray-600"><span className="font-medium">Early:</span> {r.early_note}</p>
                  )}
                </td>
                <td className="py-3 px-4">
                  {r.check_out_at ? (
                    <span className="text-gray-700">{formatTime(r.check_out_at)}</span>
                  ) : r.check_in_at && r.missing_checkout ? (
                    <span className="text-red-600 font-medium">Missing</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {r.missing_checkout ? (
                    <StatusBadge status={null} missingCheckout={r.missing_checkout} />
                  ) : (
                    <StatusBadge status={r.check_out_status} />
                  )}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onSelectRecord(r)}
                    className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors font-medium"
                  >
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
