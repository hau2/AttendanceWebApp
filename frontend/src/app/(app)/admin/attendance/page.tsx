'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStoredUser, getStoredToken } from '@/lib/api/auth';
import { listRecords, AttendanceRecordWithUser } from '@/lib/api/attendance';
import { listUsers, User } from '@/lib/api/users';
import { AttendanceRecordTable } from './components/AttendanceRecordTable';
import { AttendanceRecordDetail } from './components/AttendanceRecordDetail';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function AdminAttendancePage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<AttendanceRecordWithUser[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecordWithUser | null>(null);
  const [filterUserId, setFilterUserId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!['admin', 'owner', 'manager'].includes(user.role)) {
      router.replace('/dashboard');
      return;
    }
    // Load users for filter dropdown
    const token = getStoredToken();
    if (token) {
      listUsers(token).then(setUsers).catch(() => {});
    }
  }, [router]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listRecords(year, month, filterUserId || undefined)
      .then((data) => {
        setRecords(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load records');
        setLoading(false);
      });
  }, [year, month, filterUserId]);

  function navigate(dir: number) {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m);
    setYear(y);
  }

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Navigation links */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
        <Link href="/admin/users" className="hover:text-gray-700">Users</Link>
        <span>/</span>
        <Link href="/admin/shifts" className="hover:text-gray-700">Shifts</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Attendance Records</span>
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Month navigation */}
          <div className="flex items-center gap-2">
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

          {/* Employee filter */}
          <select
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Employees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AttendanceRecordTable records={records} onSelectRecord={setSelectedRecord} />
        )}
      </div>

      <AttendanceRecordDetail record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </div>
  );
}
