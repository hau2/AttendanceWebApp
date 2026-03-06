'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/api/auth';
import { getExecutiveSummary, ExecutiveSummary } from '@/lib/api/attendance';
import { EmployeeHistoryModal } from './components/EmployeeHistoryModal';
import { TrendingUp, FileText, AlertTriangle, ArrowUp, ArrowDown, Minus, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

function getRankClasses(rank: number): { circle: string; lateText: string } {
  if (rank === 1) return { circle: 'bg-red-100 text-red-700', lateText: 'text-red-600 font-semibold' };
  if (rank === 2) return { circle: 'bg-orange-100 text-orange-700', lateText: 'text-orange-600 font-semibold' };
  if (rank === 3) return { circle: 'bg-amber-100 text-amber-700', lateText: 'text-amber-600 font-semibold' };
  return { circle: 'bg-slate-100 text-slate-600', lateText: 'text-slate-700 font-medium' };
}

export default function ExecutiveDashboard() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<{ userId: string; fullName: string } | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.replace('/login'); return; }
    if (!['executive', 'admin', 'owner'].includes(user.role)) {
      router.replace('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getExecutiveSummary(year, month)
      .then(data => { setSummary(data); setLoading(false); })
      .catch(() => { setError('Failed to load summary'); setLoading(false); });
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-4">
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div className="flex min-w-72 flex-col gap-2">
          <h1 className="text-slate-900 text-3xl font-bold leading-tight tracking-[-0.033em]">Executive Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium leading-normal">High-level overview of attendance metrics</p>
        </div>
        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm p-1">
            <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 text-sm font-semibold text-slate-700">{MONTH_NAMES[month - 1]} {year}</span>
            <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="text-slate-500">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      <EmployeeHistoryModal
        userId={selectedEmployee?.userId ?? null}
        fullName={selectedEmployee?.fullName ?? ''}
        year={year}
        month={month}
        onClose={() => setSelectedEmployee(null)}
      />

      {summary && (
        <>
          {/* KPI Cards */}
          <div className="flex flex-wrap gap-6 mb-8">
            {/* Attendance Rate */}
            <div className="flex min-w-[240px] flex-1 flex-col gap-3 rounded-xl p-6 bg-white shadow-sm border border-slate-100">
              <div className="flex justify-between items-center">
                <p className="text-slate-500 text-sm font-medium leading-normal uppercase tracking-wider">Attendance Rate</p>
                <TrendingUp className="w-5 h-5 text-[#4848e5]" />
              </div>
              <p className="text-[#4848e5] text-4xl font-bold leading-tight">{summary.attendanceRate}%</p>
              <p className="text-emerald-600 text-sm font-medium flex items-center gap-1">
                <ArrowUp className="w-4 h-4" />
                Overall rate
              </p>
            </div>
            {/* Total Records */}
            <div className="flex min-w-[240px] flex-1 flex-col gap-3 rounded-xl p-6 bg-white shadow-sm border border-slate-100">
              <div className="flex justify-between items-center">
                <p className="text-slate-500 text-sm font-medium leading-normal uppercase tracking-wider">Total Records</p>
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-slate-900 text-4xl font-bold leading-tight">{summary.totalRecords.toLocaleString()}</p>
              <p className="text-slate-400 text-sm font-medium flex items-center gap-1">
                <Minus className="w-4 h-4" />
                This month
              </p>
            </div>
            {/* Late Check-ins */}
            <div className="flex min-w-[240px] flex-1 flex-col gap-3 rounded-xl p-6 bg-white shadow-sm border border-slate-100">
              <div className="flex justify-between items-center">
                <p className="text-slate-500 text-sm font-medium leading-normal uppercase tracking-wider">Late Check-ins</p>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-slate-900 text-4xl font-bold leading-tight">{summary.lateCount}</p>
              <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                <ArrowDown className="w-4 h-4" />
                Late this month
              </p>
            </div>
          </div>

          {/* Late Ranking */}
          <div className="mt-8">
            <h2 className="text-slate-900 text-xl font-semibold leading-tight tracking-[-0.015em] pb-4">Late Frequency Ranking</h2>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {summary.lateRanking.length === 0 ? (
                <div className="px-6 py-8 text-slate-400 text-sm text-center">No late records this month</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-slate-500 text-xs font-semibold uppercase tracking-wider w-24">Rank</th>
                      <th className="px-6 py-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-4 text-slate-500 text-xs font-semibold uppercase tracking-wider w-32">Late Days</th>
                      <th className="px-6 py-4 text-slate-500 text-xs font-semibold uppercase tracking-wider w-32">Total Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {summary.lateRanking.map((row, i) => {
                      const rank = i + 1;
                      const rc = getRankClasses(rank);
                      return (
                        <tr
                          key={row.userId}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => setSelectedEmployee({ userId: row.userId, fullName: row.fullName })}
                        >
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${rc.circle}`}>
                              {rank}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                                {getInitials(row.fullName)}
                              </div>
                              <span className="text-slate-900 font-medium text-sm">{row.fullName}</span>
                            </div>
                          </td>
                          <td className={`px-6 py-4 text-sm ${rc.lateText}`}>{row.lateCount}</td>
                          <td className="px-6 py-4 text-slate-500 text-sm">{row.totalDays}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Monthly Breakdown */}
          <div className="mt-8">
            <h2 className="text-slate-900 text-xl font-semibold leading-tight tracking-[-0.015em] pb-4">Daily Breakdown</h2>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {summary.monthlyBreakdown.length === 0 ? (
                <div className="px-6 py-8 text-slate-400 text-sm text-center">No records this month</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">Present</th>
                      <th className="px-6 py-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">Late</th>
                      <th className="px-6 py-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">Missing Checkout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {summary.monthlyBreakdown.map(day => (
                      <tr key={day.date} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-700">{day.date}</td>
                        <td className="px-6 py-4 text-sm text-slate-900">{day.present}</td>
                        <td className="px-6 py-4 text-sm text-red-600">{day.late}</td>
                        <td className="px-6 py-4 text-sm text-orange-600">{day.missingCheckout}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
