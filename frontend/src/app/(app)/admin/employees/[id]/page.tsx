'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge, RemoteBadge } from '@/components/ui/status-badge';
import { PaginationControls } from '@/components/PaginationControls';
import { listRecords, AttendanceRecordWithUser } from '@/lib/api/attendance';
import { getStoredUser } from '@/lib/api/auth';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const LIMIT = 20;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(isoStr: string | null): string {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatAckDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const now = new Date();
  const [employeeName, setEmployeeName] = useState('Employee');
  const [records, setRecords] = useState<AttendanceRecordWithUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.replace('/login'); return; }
    if (!['manager', 'admin', 'owner'].includes(user.role)) { router.replace('/dashboard'); return; }
  }, [router]);

  // Fetch employee name on mount (use first record's user name)
  useEffect(() => {
    if (!userId) return;
    listRecords(year, month, userId, 1, 1)
      .then((result) => {
        if (result.data.length > 0 && result.data[0].users?.full_name) {
          setEmployeeName(result.data[0].users.full_name);
        }
      })
      .catch(() => {});
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch records when year/month/page changes
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    listRecords(year, month, userId, page, LIMIT)
      .then((result) => {
        setRecords(result.data);
        setTotal(result.total);
        // Update employee name if we get a record with a name
        if (result.data.length > 0 && result.data[0].users?.full_name) {
          setEmployeeName(result.data[0].users.full_name);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load attendance records');
        setLoading(false);
      });
  }, [userId, year, month, page]);

  function navigate(dir: number) {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setPage(1);
    setMonth(m);
    setYear(y);
  }

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin/attendance" className="text-sm text-blue-600 hover:underline">
          &larr; Attendance Records
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">{employeeName}</h1>
      <p className="text-sm text-gray-500 mb-6">Employee Detail &mdash; monthly attendance history</p>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-3 text-gray-500 font-medium">Date</TableHead>
                <TableHead className="px-4 py-3 text-gray-500 font-medium">Check-in</TableHead>
                <TableHead className="px-4 py-3 text-gray-500 font-medium">In Status</TableHead>
                <TableHead className="px-4 py-3 text-gray-500 font-medium">Check-out</TableHead>
                <TableHead className="px-4 py-3 text-gray-500 font-medium">Out Status</TableHead>
                <TableHead className="px-4 py-3 text-gray-500 font-medium">Remote</TableHead>
                <TableHead className="px-4 py-3 text-gray-500 font-medium">Notes</TableHead>
                <TableHead className="px-4 py-3 text-gray-500 font-medium">Acknowledged</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-gray-500">
                    No attendance records for this month.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r) => (
                  <TableRow key={r.id} className="hover:bg-gray-50">
                    <TableCell className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatDate(r.work_date)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-700">
                      {formatTime(r.check_in_at)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={r.check_in_status} missingCheckout={r.missing_checkout} />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {r.check_out_at ? (
                        <span className="text-gray-700">{formatTime(r.check_out_at)}</span>
                      ) : r.check_in_at && r.missing_checkout ? (
                        <span className="text-red-600 font-medium">Missing</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={r.check_out_status} />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {r.is_remote && <RemoteBadge />}
                    </TableCell>
                    <TableCell className="px-4 py-3 max-w-xs">
                      {r.late_reason && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Late:</span> {r.late_reason}
                        </p>
                      )}
                      {r.early_note && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Early:</span> {r.early_note}
                        </p>
                      )}
                      {!r.late_reason && !r.early_note && (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {r.acknowledged_at && (
                          <span className="text-xs text-green-600">
                            Late/Early: {formatAckDate(r.acknowledged_at)}
                          </span>
                        )}
                        {r.remote_acknowledged_at && (
                          <span className="text-xs text-green-600">
                            Remote: {formatAckDate(r.remote_acknowledged_at)}
                          </span>
                        )}
                        {!r.acknowledged_at && !r.remote_acknowledged_at && (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        <PaginationControls page={page} limit={LIMIT} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
