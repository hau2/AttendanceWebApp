'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { AttendanceRecord } from '@/lib/api/attendance';
import { StatusBadge, RemoteBadge } from '@/components/ui/status-badge';

interface Props {
  records: AttendanceRecord[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  const monthName = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear();
  return `${weekday}, ${day} ${monthName}, ${year}`;
}

function formatTime(isoStr: string | null): string {
  if (!isoStr) return '\u2014';
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getMinsDisplay(r: AttendanceRecord): { text: string; cls: string } {
  if (r.minutes_late > 0) {
    return { text: `+${r.minutes_late} min`, cls: 'font-medium text-red-600' };
  }
  if (r.minutes_early > 0) {
    return { text: `-${r.minutes_early} min`, cls: 'font-medium text-amber-600' };
  }
  if (r.check_in_status === 'on-time' || r.check_in_status === 'within-grace') {
    return { text: '0 min', cls: 'text-emerald-600' };
  }
  return { text: '\u2014', cls: 'text-slate-500' };
}

export function AttendanceHistoryTable({ records }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm py-10">
        <p className="text-slate-500 text-center">No records for this month.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Mobile card view */}
      <div className="md:hidden divide-y divide-slate-200">
        {records.map((r) => {
          const isExpanded = expandedId === r.id;
          const mins = getMinsDisplay(r);
          return (
            <div key={r.id}>
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors focus:outline-none"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{formatDate(r.work_date)}</p>
                  <div className="flex items-center gap-2">
                    {r.is_remote && <RemoteBadge />}
                    <StatusBadge status={r.check_in_status} missingCheckout={r.missing_checkout} />
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-4 text-sm text-slate-600">
                  <span>In: <span className="font-medium text-slate-700">{formatTime(r.check_in_at)}</span></span>
                  <span>Out: {r.check_out_at ? (
                    <span className="font-medium text-slate-700">{formatTime(r.check_out_at)}</span>
                  ) : r.check_in_at && r.missing_checkout ? (
                    <span className="font-medium text-red-500">Missing</span>
                  ) : (
                    <span className="text-slate-400">{'\u2014'}</span>
                  )}</span>
                  <span className={mins.cls}>{mins.text}</span>
                </div>
              </button>
              {isExpanded && (
                <div className="px-4 pb-3">
                  <div className="flex gap-4 p-3 bg-white rounded-lg border border-slate-200 shadow-sm flex-wrap">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Check-in Photo</span>
                      {r.check_in_photo_url ? (
                        <img src={r.check_in_photo_url} alt="Check-in photo" className="w-28 h-20 object-cover rounded-md border border-slate-300" />
                      ) : (
                        <div className="w-28 h-20 bg-slate-200 rounded-md border border-slate-300 flex items-center justify-center text-slate-400 text-xs">No photo</div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Check-out Photo</span>
                      {r.check_out_photo_url ? (
                        <img src={r.check_out_photo_url} alt="Check-out photo" className="w-28 h-20 object-cover rounded-md border border-slate-300" />
                      ) : (
                        <div className="w-28 h-20 bg-slate-200 rounded-md border border-slate-300 flex items-center justify-center text-slate-400 text-xs">No photo</div>
                      )}
                    </div>
                    {(r.late_reason || r.early_note) && (
                      <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Note / Reason</span>
                        {r.late_reason && (
                          <div className="p-2 bg-amber-50 rounded-md border border-amber-100 text-sm text-slate-700">
                            <p><strong className="font-medium text-amber-800">Late Reason:</strong> {r.late_reason}</p>
                          </div>
                        )}
                        {r.early_note && (
                          <div className="p-2 bg-[#4848e5]/10 rounded-md border border-[#4848e5]/20 text-sm text-slate-700">
                            <p><strong className="font-medium text-[#4848e5]">Early Note:</strong> {r.early_note}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Check-in</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Check-out</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mins Late/Early</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Remote</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Ack</th>
            <th className="px-6 py-4 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {records.map((r) => {
            const isExpanded = expandedId === r.id;
            const mins = getMinsDisplay(r);
            return (
              <><tr
                  key={r.id}
                  className={`hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50/50' : ''}`}
                >
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">{formatDate(r.work_date)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatTime(r.check_in_at)}</td>
                  <td className="px-6 py-4 text-sm">
                    {r.check_out_at ? (
                      <span className="text-slate-600">{formatTime(r.check_out_at)}</span>
                    ) : r.check_in_at && r.missing_checkout ? (
                      <span className="font-medium text-red-500">Missing</span>
                    ) : (
                      <span className="text-slate-400">{'\u2014'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm"><StatusBadge status={r.check_in_status} missingCheckout={r.missing_checkout} /></td>
                  <td className={`px-6 py-4 text-sm ${mins.cls}`}>{mins.text}</td>
                  <td className="px-6 py-4 text-sm text-center">
                    {r.is_remote && <RemoteBadge />}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    {(r.acknowledged_at || r.remote_acknowledged_at) ? (
                      <span className="inline-block w-4 h-4 rounded border border-[#4848e5] bg-[#4848e5] text-white text-xs leading-4 text-center">&#10003;</span>
                    ) : (
                      <span className="inline-block w-4 h-4 rounded border border-slate-300 bg-white" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${r.id}-detail`} className="bg-slate-50/50 border-b border-slate-200">
                    <td colSpan={8} className="px-6 pb-4">
                      <div className="flex gap-6 p-4 bg-white rounded-lg border border-slate-200 shadow-sm ml-8 flex-wrap">
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Check-in Photo</span>
                          {r.check_in_photo_url ? (
                            <img src={r.check_in_photo_url} alt="Check-in photo" className="w-32 h-24 object-cover rounded-md border border-slate-300" />
                          ) : (
                            <div className="w-32 h-24 bg-slate-200 rounded-md border border-slate-300 flex items-center justify-center text-slate-400 text-xs">No photo</div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Check-out Photo</span>
                          {r.check_out_photo_url ? (
                            <img src={r.check_out_photo_url} alt="Check-out photo" className="w-32 h-24 object-cover rounded-md border border-slate-300" />
                          ) : (
                            <div className="w-32 h-24 bg-slate-200 rounded-md border border-slate-300 flex items-center justify-center text-slate-400 text-xs">No photo</div>
                          )}
                        </div>
                        {(r.late_reason || r.early_note) && (
                          <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Note / Reason</span>
                            {r.late_reason && (
                              <div className="p-3 bg-amber-50 rounded-md border border-amber-100 text-sm text-slate-700">
                                <p><strong className="font-medium text-amber-800">Late Reason:</strong> {r.late_reason}</p>
                              </div>
                            )}
                            {r.early_note && (
                              <div className="p-3 bg-[#4848e5]/10 rounded-md border border-[#4848e5]/20 text-sm text-slate-700">
                                <p><strong className="font-medium text-[#4848e5]">Early Note:</strong> {r.early_note}</p>
                              </div>
                            )}
                          </div>
                        )}
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
    </div>
  );
}
