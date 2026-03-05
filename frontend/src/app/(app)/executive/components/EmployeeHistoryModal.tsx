'use client';

import { useEffect, useState } from 'react';
import { listRecords, AttendanceRecordWithUser } from '@/lib/api/attendance';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { StatusBadge, RemoteBadge } from '@/components/ui/status-badge';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface Props {
  userId: string | null;
  fullName: string;
  year: number;
  month: number;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

function formatTime(isoStr: string | null): string {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}

function truncate(str: string | null, max = 40): string {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export function EmployeeHistoryModal({ userId, fullName, year, month, onClose }: Props) {
  const [records, setRecords] = useState<AttendanceRecordWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setRecords([]);
      return;
    }
    setLoading(true);
    setError(null);
    listRecords(year, month, userId, 1, 100)
      .then((result) => {
        setRecords(result.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load attendance records.');
        setLoading(false);
      });
  }, [userId, year, month]);

  return (
    <Dialog open={!!userId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>{fullName}</DialogTitle>
          <p className="text-sm text-gray-500">
            {MONTH_NAMES[month - 1]} {year}
          </p>
        </DialogHeader>

        {loading && (
          <div className="text-gray-400 text-sm text-center py-6">Loading...</div>
        )}

        {error && (
          <div className="text-red-600 text-sm text-center py-6">{error}</div>
        )}

        {!loading && !error && records.length === 0 && (
          <div className="text-gray-400 text-sm text-center py-6">No records for this period.</div>
        )}

        {!loading && !error && records.length > 0 && (
          <div className="max-h-[70vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Out Status</TableHead>
                  <TableHead>Remote</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Acknowledged</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-medium">{formatDate(rec.work_date)}</TableCell>
                    <TableCell>{formatTime(rec.check_in_at)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={rec.check_in_status}
                        missingCheckout={rec.missing_checkout}
                      />
                    </TableCell>
                    <TableCell>{formatTime(rec.check_out_at)}</TableCell>
                    <TableCell>
                      <StatusBadge status={rec.check_out_status} />
                    </TableCell>
                    <TableCell>
                      {rec.is_remote ? <RemoteBadge /> : <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell className="max-w-[160px] text-xs text-gray-600">
                      {truncate(rec.late_reason || rec.early_note)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {rec.acknowledged_at
                        ? `Late/Early ${formatDate(rec.acknowledged_at.slice(0, 10))}`
                        : rec.remote_acknowledged_at
                        ? `Remote ${formatDate(rec.remote_acknowledged_at.slice(0, 10))}`
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
