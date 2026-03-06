'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/api/auth';
import { getMonthlyReport, downloadAttendanceCsv, MonthlyReport } from '@/lib/api/attendance';
import { PaginationControls } from '@/components/PaginationControls';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className="max-w-[1200px] mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-slate-900 text-3xl font-bold leading-tight tracking-tight">Monthly Report</h1>
        <div className="flex items-center gap-4 flex-wrap">
          {/* Month nav */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm p-1">
            <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 text-sm font-semibold text-slate-700">{MONTH_NAMES[month - 1]} {year}</span>
            <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || !report}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[#4848e5] hover:bg-[#4848e5]/90 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {loading && <div className="text-slate-500">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {report && (
        <>
          {/* Summary stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="flex flex-col gap-2 rounded-xl p-5 bg-white border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm font-medium leading-normal">Total Records</p>
              <p className="text-slate-900 text-2xl font-bold leading-tight">{report.stats.total.toLocaleString()}</p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-5 bg-white border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm font-medium leading-normal">On Time</p>
              <p className="text-green-600 text-2xl font-bold leading-tight">{report.stats.onTimeCount.toLocaleString()}</p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-5 bg-white border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm font-medium leading-normal">Within Grace</p>
              <p className="text-yellow-600 text-2xl font-bold leading-tight">{report.stats.withinGraceCount.toLocaleString()}</p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-5 bg-white border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm font-medium leading-normal">Late</p>
              <p className="text-red-600 text-2xl font-bold leading-tight">{report.stats.lateCount.toLocaleString()}</p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-5 bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-red-50 z-0"></div>
              <p className="text-red-800 text-sm font-medium leading-normal relative z-10">Late Rate</p>
              <p className="text-red-600 text-2xl font-bold leading-tight relative z-10">{report.stats.lateRate}%</p>
            </div>
          </div>

          {/* Records table */}
          <div className="flex flex-col gap-4">
            <h3 className="text-slate-900 text-xl font-bold leading-tight tracking-tight">Records</h3>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {report.records.length === 0 ? (
                <div className="px-6 py-8 text-slate-400 text-sm text-center">No records this month</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Check-in</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {report.records.map(rec => (
                        <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-600">{rec.work_date}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                            {(rec as any).users?.full_name || rec.user_id}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {rec.check_in_at ? new Date(rec.check_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              rec.check_in_status === 'late' ? 'bg-red-100 text-red-800' :
                              rec.check_in_status === 'within-grace' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {rec.check_in_status === 'on-time' ? 'On Time' :
                               rec.check_in_status === 'within-grace' ? 'Within Grace' :
                               rec.check_in_status === 'late' ? 'Late' :
                               rec.check_in_status || '--'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-[200px]">
                            {rec.late_reason || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <PaginationControls page={page} limit={LIMIT} total={total} onPageChange={setPage} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
