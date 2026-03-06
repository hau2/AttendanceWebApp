'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getStoredUser } from '@/lib/api/auth';
import { getHistory, AttendanceRecord } from '@/lib/api/attendance';
import { AttendanceHistoryTable } from './components/AttendanceHistoryTable';
import { PaginationControls } from '@/components/PaginationControls';

const LIMIT = 20;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function AttendanceHistoryPage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'admin' || user.role === 'owner') {
      router.replace('/admin/attendance');
      return;
    }
  }, [router]);

  useEffect(() => {
    setLoading(true);
    getHistory(year, month).then((data) => {
      setRecords(data);
      setPage(1);
      setLoading(false);
    });
  }, [year, month]);

  function navigate(dir: number) {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m);
    setYear(y);
  }

  const pagedRecords = records.slice((page - 1) * LIMIT, page * LIMIT);

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold leading-tight tracking-tight">My Attendance History</h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button className="flex items-center justify-center rounded-lg h-9 bg-[#4848e5] text-white gap-2 text-sm font-semibold px-4 shadow-sm hover:bg-[#4848e5]/90 transition-colors">
            <Calendar className="w-[18px] h-[18px]" />
            <span>{monthLabel}</span>
          </button>
        </div>
      </div>

      {/* Table container */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center py-10">
          <div className="w-6 h-6 border-4 border-[#4848e5] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <AttendanceHistoryTable records={pagedRecords} />
          {records.length > LIMIT && (
            <div className="mt-4">
              <PaginationControls page={page} limit={LIMIT} total={records.length} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
