'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/api/auth';
import { getMonthlyReport, downloadAttendanceCsv, MonthlyReport } from '@/lib/api/attendance';
import { PaginationControls } from '@/components/PaginationControls';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const LIMIT = 20;

export default function AdminReportsPage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.replace('/login'); return; }
    if (!['admin', 'owner', 'manager'].includes(user.role)) {
      router.replace('/dashboard');
    }
  }, [router]);

  // Reset page to 1 when year or month changes
  useEffect(() => { setPage(1); }, [year, month]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMonthlyReport(year, month, page, LIMIT)
      .then(data => { setReport(data); setTotal(data.total); setLoading(false); })
      .catch(() => { setError('Failed to load report'); setLoading(false); });
  }, [year, month, page]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadAttendanceCsv(year, month);
    } catch {
      alert('CSV export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Monthly Report</h1>
        <button
          onClick={handleExport}
          disabled={exporting || !report}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={prevMonth} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">&larr;</button>
        <span className="font-medium text-gray-700">{MONTH_NAMES[month - 1]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">&rarr;</button>
      </div>

      {loading && <div className="text-gray-500">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {report && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-5 gap-3 mb-8">
            {[
              { label: 'Total', value: report.stats.total, color: 'text-gray-900' },
              { label: 'On Time', value: report.stats.onTimeCount, color: 'text-green-600' },
              { label: 'Within Grace', value: report.stats.withinGraceCount, color: 'text-yellow-600' },
              { label: 'Late', value: report.stats.lateCount, color: 'text-red-600' },
              { label: 'Late Rate', value: `${report.stats.lateRate}%`, color: 'text-red-500' },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
                <div className="text-xs text-gray-500 mt-1">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Records table */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Records ({total})</h2>
            </div>
            {report.records.length === 0 ? (
              <div className="px-5 py-6 text-gray-400 text-sm text-center">No records this month</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Employee</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Check-in</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Late Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.records.map(rec => (
                      <tr key={rec.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">{rec.work_date}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {(rec as any).users?.full_name || rec.user_id}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {rec.check_in_at ? new Date(rec.check_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            rec.check_in_status === 'late' ? 'bg-red-100 text-red-700' :
                            rec.check_in_status === 'within-grace' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {rec.check_in_status || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                          {rec.late_reason || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <PaginationControls page={page} limit={LIMIT} total={total} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
