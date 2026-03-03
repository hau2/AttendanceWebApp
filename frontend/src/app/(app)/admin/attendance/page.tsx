'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStoredUser, getStoredToken } from '@/lib/api/auth';
import { listRecords, AttendanceRecordWithUser, getTeamSummary, TeamSummary } from '@/lib/api/attendance';
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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState('');
  const [teamSummary, setTeamSummary] = useState<TeamSummary | null>(null);

  // Filters (all client-side)
  const [searchName, setSearchName] = useState('');
  const [filterDivisionId, setFilterDivisionId] = useState('');
  const [filterManagerId, setFilterManagerId] = useState('');

  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.replace('/login'); return; }
    if (!['admin', 'owner', 'manager'].includes(user.role)) { router.replace('/dashboard'); return; }
    setUserRole(user.role);
    const token = getStoredToken();
    if (token) listUsers(token).then(setUsers).catch(() => {});
  }, [router]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    if (userRole === 'manager') {
      getTeamSummary(year, month).then(setTeamSummary).catch(() => setTeamSummary(null));
    }
    listRecords(year, month)
      .then((data) => { setRecords(data); setLoading(false); })
      .catch(() => { setError('Failed to load records'); setLoading(false); });
  }, [year, month, userRole]);

  function navigate(dir: number) {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m);
    setYear(y);
  }

  function handleAdjusted(updated: AttendanceRecordWithUser) {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
    setSelectedRecord((prev) => (prev ? { ...prev, ...updated } : prev));
  }

  // Build usersMap for O(1) lookup by user_id
  const usersMap: Record<string, User> = {};
  users.forEach((u) => { usersMap[u.id] = u; });

  // Extract unique divisions from users list
  const divisionOptions: { id: string; name: string }[] = [];
  const seenDivisions = new Set<string>();
  users.forEach((u) => {
    if (u.divisions && !seenDivisions.has(u.divisions.id)) {
      seenDivisions.add(u.divisions.id);
      divisionOptions.push({ id: u.divisions.id, name: u.divisions.name });
    }
  });

  // Extract unique managers from users list (via division.users)
  const managerOptions: { id: string; full_name: string }[] = [];
  const seenManagers = new Set<string>();
  users.forEach((u) => {
    const mgr = u.divisions?.users;
    if (mgr && !seenManagers.has(mgr.id)) {
      seenManagers.add(mgr.id);
      managerOptions.push({ id: mgr.id, full_name: mgr.full_name });
    }
  });

  // Apply client-side filters
  const filteredRecords = records.filter((r) => {
    if (searchName) {
      const name = (r.users?.full_name || usersMap[r.user_id]?.full_name || '').toLowerCase();
      if (!name.includes(searchName.toLowerCase())) return false;
    }
    if (filterDivisionId) {
      const user = usersMap[r.user_id];
      if (!user || user.divisions?.id !== filterDivisionId) return false;
    }
    if (filterManagerId) {
      const user = usersMap[r.user_id];
      if (!user || user.divisions?.users?.id !== filterManagerId) return false;
    }
    return true;
  });

  const hasFilters = searchName || filterDivisionId || filterManagerId;
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

      {userRole === 'manager' && teamSummary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{teamSummary.total}</div>
            <div className="text-sm text-gray-500 mt-1">Total Records</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{teamSummary.late}</div>
            <div className="text-sm text-gray-500 mt-1">Late Check-ins</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{teamSummary.punctualityRate}%</div>
            <div className="text-sm text-gray-500 mt-1">Punctuality Rate</div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
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
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search by name */}
        <input
          type="text"
          placeholder="Search employee..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
        />

        {/* Filter by division */}
        {divisionOptions.length > 0 && (
          <select
            value={filterDivisionId}
            onChange={(e) => { setFilterDivisionId(e.target.value); setFilterManagerId(''); }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Divisions</option>
            {divisionOptions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}

        {/* Filter by manager (admin/owner only) */}
        {['admin', 'owner'].includes(userRole) && managerOptions.length > 0 && (
          <select
            value={filterManagerId}
            onChange={(e) => { setFilterManagerId(e.target.value); setFilterDivisionId(''); }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Managers</option>
            {managerOptions.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </select>
        )}

        {hasFilters && (
          <button
            onClick={() => { setSearchName(''); setFilterDivisionId(''); setFilterManagerId(''); }}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Clear filters
          </button>
        )}

        {hasFilters && (
          <span className="text-sm text-gray-400">
            {filteredRecords.length} of {records.length} records
          </span>
        )}
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
          <AttendanceRecordTable
            records={filteredRecords}
            usersMap={usersMap}
            onSelectRecord={setSelectedRecord}
          />
        )}
      </div>

      <AttendanceRecordDetail
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onAdjusted={handleAdjusted}
        userRole={userRole}
      />
    </div>
  );
}
