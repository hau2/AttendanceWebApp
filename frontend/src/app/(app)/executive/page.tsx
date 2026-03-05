'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/api/auth';
import { getExecutiveSummary, ExecutiveSummary } from '@/lib/api/attendance';
import { EmployeeHistoryModal } from './components/EmployeeHistoryModal';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Executive Dashboard</h1>

      {/* Month navigation */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={prevMonth} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">&larr;</button>
        <span className="font-medium text-gray-700">{MONTH_NAMES[month - 1]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">&rarr;</button>
      </div>

      {loading && <div className="text-gray-500">Loading...</div>}
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
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
              <div className="text-3xl font-bold text-blue-600">{summary.attendanceRate}%</div>
              <div className="text-sm text-gray-500 mt-1">Attendance Rate</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
              <div className="text-3xl font-bold text-gray-900">{summary.totalRecords}</div>
              <div className="text-sm text-gray-500 mt-1">Total Records</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
              <div className="text-3xl font-bold text-red-600">{summary.lateCount}</div>
              <div className="text-sm text-gray-500 mt-1">Late Check-ins</div>
            </div>
          </div>

          {/* Late Ranking */}
          <div className="bg-white rounded-lg border border-gray-200 mb-8">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Late Frequency Ranking</h2>
            </div>
            {summary.lateRanking.length === 0 ? (
              <div className="px-5 py-6 text-gray-400 text-sm text-center">No late records this month</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">#</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Employee</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Late Days</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Total Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.lateRanking.map((row, i) => (
                    <tr
                      key={row.userId}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedEmployee({ userId: row.userId, fullName: row.fullName })}
                    >
                      <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{row.fullName}</td>
                      <td className="px-5 py-3 text-right text-red-600 font-medium">{row.lateCount}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{row.totalDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Monthly Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Daily Breakdown</h2>
            </div>
            {summary.monthlyBreakdown.length === 0 ? (
              <div className="px-5 py-6 text-gray-400 text-sm text-center">No records this month</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Date</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Present</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Late</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Missing Checkout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.monthlyBreakdown.map(day => (
                    <tr key={day.date} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-700">{day.date}</td>
                      <td className="px-5 py-3 text-right text-gray-900">{day.present}</td>
                      <td className="px-5 py-3 text-right text-red-600">{day.late}</td>
                      <td className="px-5 py-3 text-right text-orange-600">{day.missingCheckout}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
