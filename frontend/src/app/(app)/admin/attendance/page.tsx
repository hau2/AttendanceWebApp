'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStoredUser, getStoredToken } from '@/lib/api/auth';
import { listRecords, AttendanceRecordWithUser, getTeamSummary, TeamSummary, triggerRefresh } from '@/lib/api/attendance';
import { getCompanySettings } from '@/lib/api/company';
import { listUsers, User } from '@/lib/api/users';
import { AttendanceRecordTable } from './components/AttendanceRecordTable';
import { AttendanceRecordDetail } from './components/AttendanceRecordDetail';
import { PaginationControls } from '@/components/PaginationControls';
import { ChevronRight, RefreshCw, Search, ChevronDown } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const LIMIT = 20;

export default function AdminAttendancePage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<AttendanceRecordWithUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
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
  const [filterStatus, setFilterStatus] = useState('');

  // Data refresh state
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.replace('/login'); return; }
    if (!['admin', 'owner', 'manager'].includes(user.role)) { router.replace('/dashboard'); return; }
    setUserRole(user.role);
    const token = getStoredToken();
    if (token) listUsers(token, 1, 1000).then(r => setUsers(r.data)).catch(() => {});
    if (token && ['admin', 'owner'].includes(user.role)) {
      getCompanySettings(token).then((s) => setLastRefreshAt(s.last_refresh_at)).catch(() => {});
    }
  }, [router]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    if (userRole === 'manager') {
      getTeamSummary(year, month).then(setTeamSummary).catch(() => setTeamSummary(null));
    }
    listRecords(year, month, undefined, page, LIMIT)
      .then((result) => { setRecords(result.data); setTotal(result.total); setLoading(false); })
      .catch(() => { setError('Failed to load records'); setLoading(false); });
  }, [year, month, userRole, page]);

  function navigate(dir: number) {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setPage(1);
    setMonth(m);
    setYear(y);
  }

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const result = await triggerRefresh();
      setLastRefreshAt(result.lastRefreshAt);
      // Reload records to show newly inserted absent rows
      const data = await listRecords(year, month, undefined, page, LIMIT);
      setRecords(data.data);
      setTotal(data.total);
    } catch (err: unknown) {
      setRefreshError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }

  function handleAdjusted(updated: AttendanceRecordWithUser) {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
    setSelectedRecord((prev) => (prev ? { ...prev, ...updated } : prev));
  }

  // Build usersMap for O(1) lookup by user_id
  const usersMap: Record<string, User> = {};
  users.forEach((u) => { usersMap[u.id] = u; });

  // Extract unique divisions and managers from users who appear in *records*
  const divisionOptions: { id: string; name: string }[] = [];
  const managerOptions: { id: string; full_name: string }[] = [];
  const seenDivisions = new Set<string>();
  const seenManagers = new Set<string>();
  records.forEach((r) => {
    const user = usersMap[r.user_id];
    if (user?.divisions && !seenDivisions.has(user.divisions.id)) {
      seenDivisions.add(user.divisions.id);
      divisionOptions.push({ id: user.divisions.id, name: user.divisions.name });
    }
    const mgr = user?.divisions?.users;
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
    if (filterStatus) {
      if (filterStatus === 'late' && r.check_in_status !== 'late') return false;
      if (filterStatus === 'early' && r.check_out_status !== 'early') return false;
      if (filterStatus === 'absent' && r.check_in_status !== 'absent') return false;
      if (filterStatus === 'absent_morning' && r.check_in_status !== 'absent_morning') return false;
      if (filterStatus === 'absent_afternoon' &&
          r.check_out_status !== 'absent_afternoon' &&
          !(r.check_in_at !== null && r.check_out_at === null)) return false;
    }
    return true;
  });

  const hasFilters = searchName || filterDivisionId || filterManagerId || filterStatus;
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="max-w-[1152px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex flex-wrap gap-2 py-6">
        <Link href="/admin/users" className="text-slate-500 hover:text-[#4848e5] transition-colors text-sm font-medium leading-normal flex items-center gap-1">
          Users
        </Link>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <Link href="/admin/shifts" className="text-slate-500 hover:text-[#4848e5] transition-colors text-sm font-medium leading-normal flex items-center gap-1">
          Shifts
        </Link>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <span className="text-slate-900 text-sm font-medium leading-normal flex items-center gap-1">
          Attendance Records
        </span>
      </div>

      {userRole === 'manager' && teamSummary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl p-6 bg-white shadow-sm border border-slate-100 text-center">
            <div className="text-4xl font-bold text-slate-900">{teamSummary.total}</div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Total Records</div>
          </div>
          <div className="rounded-xl p-6 bg-white shadow-sm border border-slate-100 text-center">
            <div className="text-4xl font-bold text-red-600">{teamSummary.late}</div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Late Check-ins</div>
          </div>
          <div className="rounded-xl p-6 bg-white shadow-sm border border-slate-100 text-center">
            <div className="text-4xl font-bold text-green-600">{teamSummary.punctualityRate}%</div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Punctuality Rate</div>
          </div>
        </div>
      )}

      {/* Title + Refresh + Month Nav */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
        <p className="text-slate-900 tracking-tight text-3xl font-bold leading-tight">Attendance Records</p>
        <div className="flex items-center gap-4 flex-wrap">
          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-sm"
            >
              &#8249;
            </button>
            <span className="text-slate-700 font-medium w-36 text-center text-sm">{monthLabel}</span>
            <button
              onClick={() => navigate(1)}
              className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-sm"
            >
              &#8250;
            </button>
          </div>

          {/* Data Refresh button (admin/owner only) */}
          {['admin', 'owner'].includes(userRole) && (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 cursor-pointer justify-center overflow-hidden rounded-lg h-10 px-5 bg-[#4848e5] hover:bg-[#4848e5]/90 text-white text-sm font-medium leading-normal transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Data Refresh'}</span>
              </button>
              {lastRefreshAt && (
                <span className="text-xs text-slate-400">
                  Last: {new Date(lastRefreshAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {refreshError && <span className="text-xs text-red-500">{refreshError}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-3">
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Search by name */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4848e5]/50 focus:border-[#4848e5] text-slate-900 placeholder-slate-400"
            />
          </div>

          {/* Filter by division */}
          <div className="relative">
            <select
              value={filterDivisionId}
              onChange={(e) => { setFilterDivisionId(e.target.value); setFilterManagerId(''); }}
              className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4848e5]/50 focus:border-[#4848e5] text-slate-700 cursor-pointer min-w-[140px]"
            >
              <option value="">Division</option>
              {divisionOptions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5" />
          </div>

          {/* Filter by manager (admin/owner only) */}
          {['admin', 'owner'].includes(userRole) && (
            <div className="relative">
              <select
                value={filterManagerId}
                onChange={(e) => { setFilterManagerId(e.target.value); setFilterDivisionId(''); }}
                className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4848e5]/50 focus:border-[#4848e5] text-slate-700 cursor-pointer min-w-[140px]"
              >
                <option value="">Manager</option>
                {managerOptions.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5" />
            </div>
          )}

          {/* Filter by status */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4848e5]/50 focus:border-[#4848e5] text-slate-700 cursor-pointer min-w-[140px]"
            >
              <option value="">Status</option>
              <option value="late">Late</option>
              <option value="early">Early Leave</option>
              <option value="absent">Absent</option>
              <option value="absent_morning">Absent Morning</option>
              <option value="absent_afternoon">Absent Afternoon</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5" />
          </div>

          {hasFilters && (
            <button
              onClick={() => { setSearchName(''); setFilterDivisionId(''); setFilterManagerId(''); setFilterStatus(''); }}
              className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}

          {hasFilters && (
            <span className="text-sm text-slate-400 flex items-center">
              {filteredRecords.length} of {records.length} records
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#4848e5] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AttendanceRecordTable
            records={filteredRecords}
            usersMap={usersMap}
            onSelectRecord={setSelectedRecord}
          />
        )}
        <PaginationControls page={page} limit={LIMIT} total={total} onPageChange={setPage} />
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
