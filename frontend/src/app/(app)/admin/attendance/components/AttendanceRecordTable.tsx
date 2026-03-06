'use client';

import Link from 'next/link';
import { AttendanceRecordWithUser } from '@/lib/api/attendance';
import { User } from '@/lib/api/users';
import { StatusBadge, RemoteBadge } from '@/components/ui/status-badge';
import { Eye } from 'lucide-react';

interface Props {
  records: AttendanceRecordWithUser[];
  usersMap: Record<string, User>;
  onSelectRecord: (r: AttendanceRecordWithUser) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function formatTime(isoStr: string | null): string {
  if (!isoStr) return '\u2014';
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

function getEmpCode(id: string): string {
  return 'EMP-' + id.slice(0, 3).toUpperCase();
}

export function AttendanceRecordTable({ records, usersMap, onSelectRecord }: Props) {
  if (records.length === 0) {
    return <p className="text-slate-500 text-center py-10">No attendance records for this period.</p>;
  }

  return (
    <>
      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {records.map((r) => {
          const user = usersMap[r.user_id];
          const fullName = r.users?.full_name || user?.full_name || 'Unknown';
          return (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
                    {getInitials(fullName)}
                  </div>
                  <div>
                    <Link
                      href={`/admin/employees/${r.user_id}`}
                      className="text-sm font-medium text-[#4848e5] hover:text-[#4848e5]/80 transition-colors"
                    >
                      {fullName}
                    </Link>
                    <div className="text-xs text-slate-500">{getEmpCode(r.user_id)}</div>
                  </div>
                </div>
                <button
                  onClick={() => onSelectRecord(r)}
                  className="text-[#4848e5] hover:text-[#4848e5]/80 transition-colors inline-flex items-center gap-1 text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
              </div>

              <div className="text-xs text-slate-500 font-medium">{formatDate(r.work_date)}</div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <div className="text-xs text-slate-500 mb-1">Check-in</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium text-slate-900">{formatTime(r.check_in_at)}</span>
                    <StatusBadge status={r.check_in_status} />
                  </div>
                  {r.is_remote && <div className="mt-1"><RemoteBadge /></div>}
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <div className="text-xs text-slate-500 mb-1">Check-out</div>
                  {r.check_out_at ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium text-slate-600">{formatTime(r.check_out_at)}</span>
                      {r.missing_checkout ? (
                        <StatusBadge status={null} missingCheckout={r.missing_checkout} />
                      ) : (
                        <StatusBadge status={r.check_out_status} />
                      )}
                    </div>
                  ) : r.check_in_at && r.missing_checkout ? (
                    <span className="text-sm text-red-600 font-medium">Missing</span>
                  ) : (
                    <span className="text-sm text-slate-400">{'\u2014'}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left min-w-[1000px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Division</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Manager</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Check-in</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Check-out</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {records.map((r) => {
            const user = usersMap[r.user_id];
            const fullName = r.users?.full_name || user?.full_name || 'Unknown';
            const divisionName = user?.divisions?.name ?? '\u2014';
            const managerName = user?.divisions?.users?.full_name ?? '\u2014';
            return (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600 shrink-0">
                      {getInitials(fullName)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        <Link
                          href={`/admin/employees/${r.user_id}`}
                          className="text-[#4848e5] hover:text-[#4848e5]/80 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {fullName}
                        </Link>
                      </div>
                      <div className="text-xs text-slate-500">{getEmpCode(r.user_id)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{divisionName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{managerName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatDate(r.work_date)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-900 font-medium">{formatTime(r.check_in_at)}</span>
                      <StatusBadge status={r.check_in_status} />
                    </div>
                    {r.is_remote && <RemoteBadge />}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {r.check_out_at ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">{formatTime(r.check_out_at)}</span>
                      {r.missing_checkout ? (
                        <StatusBadge status={null} missingCheckout={r.missing_checkout} />
                      ) : (
                        <StatusBadge status={r.check_out_status} />
                      )}
                    </div>
                  ) : r.check_in_at && r.missing_checkout ? (
                    <span className="text-sm text-red-600 font-medium">Missing</span>
                  ) : (
                    <span className="text-sm text-slate-400">{'\u2014'}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onSelectRecord(r)}
                    className="text-[#4848e5] hover:text-[#4848e5]/80 transition-colors inline-flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}
