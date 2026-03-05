'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Attendance History</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 text-gray-600 font-medium"
          >
            &#8249;
          </button>
          <span className="text-gray-700 font-medium w-36 text-center">{monthLabel}</span>
          <button
            onClick={() => navigate(1)}
            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 text-gray-600 font-medium"
          >
            &#8250;
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <AttendanceHistoryTable records={pagedRecords} />
            {records.length > LIMIT && (
              <PaginationControls page={page} limit={LIMIT} total={records.length} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
