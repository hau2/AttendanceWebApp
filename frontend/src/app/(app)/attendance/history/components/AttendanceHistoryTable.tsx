'use client';

import { useState } from 'react';
import { AttendanceRecord } from '@/lib/api/attendance';
import { StatusBadge, RemoteBadge } from '@/components/ui/status-badge';

interface Props {
  records: AttendanceRecord[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(isoStr: string | null): string {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function AttendanceHistoryTable({ records }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (records.length === 0) {
    return <p className="text-gray-500 text-center py-10">No records for this month.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium">Check-in</th>
            <th className="pb-3 font-medium">Check-out</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Mins Late/Early</th>
            <th className="pb-3 font-medium">Remote</th>
            <th className="pb-3 font-medium">Acknowledged</th>
            <th className="pb-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            const isExpanded = expandedId === r.id;
            return (
              <>
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 text-gray-900">{formatDate(r.work_date)}</td>
                  <td className="py-3 text-gray-700">{formatTime(r.check_in_at)}</td>
                  <td className="py-3">
                    {r.check_out_at ? (
                      <span className="text-gray-700">{formatTime(r.check_out_at)}</span>
                    ) : r.check_in_at && r.missing_checkout ? (
                      <span className="text-red-600 font-medium">Missing</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3"><StatusBadge status={r.check_in_status} missingCheckout={r.missing_checkout} /></td>
                  <td className="py-3">
                    {r.minutes_late > 0 && <span className="text-red-600">+{r.minutes_late} min</span>}
                    {r.minutes_early > 0 && <span className="text-orange-600">-{r.minutes_early} min</span>}
                  </td>
                  <td className="py-3">
                    {r.is_remote && <RemoteBadge />}
                  </td>
                  <td className="py-3 text-xs text-gray-500">
                    {(r.acknowledged_at || r.remote_acknowledged_at) ? (
                      <span className="text-green-600 font-medium">
                        {r.acknowledged_at && `Late/Early: ${new Date(r.acknowledged_at).toLocaleDateString()}`}
                        {r.acknowledged_at && r.remote_acknowledged_at && ' | '}
                        {r.remote_acknowledged_at && `Remote: ${new Date(r.remote_acknowledged_at).toLocaleDateString()}`}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="text-gray-400 hover:text-gray-700 transition-colors p-1"
                      aria-label="Toggle details"
                    >
                      <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${r.id}-detail`} className="bg-gray-50 border-b border-gray-100">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="flex gap-8 flex-wrap">
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-2">CHECK-IN PHOTO</p>
                          {r.check_in_photo_url ? (
                            <img src={r.check_in_photo_url} alt="Check-in photo" className="w-32 h-24 object-cover rounded" />
                          ) : (
                            <p className="text-gray-400 text-sm">No photo</p>
                          )}
                          {r.late_reason && (
                            <p className="text-xs text-gray-600 mt-2"><span className="font-medium">Late reason:</span> {r.late_reason}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-2">CHECK-OUT PHOTO</p>
                          {r.check_out_photo_url ? (
                            <img src={r.check_out_photo_url} alt="Check-out photo" className="w-32 h-24 object-cover rounded" />
                          ) : (
                            <p className="text-gray-400 text-sm">No photo</p>
                          )}
                          {r.early_note && (
                            <p className="text-xs text-gray-600 mt-2"><span className="font-medium">Early note:</span> {r.early_note}</p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
