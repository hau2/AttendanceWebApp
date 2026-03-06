'use client';

import { useState } from 'react';
import { AttendanceRecordWithUser, adjustRecord } from '@/lib/api/attendance';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Props {
  record: AttendanceRecordWithUser;
  onClose: () => void;
  onSaved: (updated: AttendanceRecordWithUser) => void;
}

/**
 * Convert a UTC ISO timestamp to the value needed by <input type="datetime-local">.
 * datetime-local expects "YYYY-MM-DDTHH:MM" in the browser's local time.
 */
function toDatetimeLocal(isoStr: string | null): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  // Adjust for local timezone offset so the slice represents local time
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

/**
 * Convert a datetime-local value back to a UTC ISO string for the backend.
 * new Date() treats a bare datetime string (no timezone) as local time,
 * so toISOString() correctly converts it to UTC.
 */
function fromDatetimeLocal(localStr: string): string {
  if (!localStr) return '';
  return new Date(localStr).toISOString();
}

export function AdjustAttendanceModal({ record, onClose, onSaved }: Props) {
  const [checkInAt, setCheckInAt] = useState(toDatetimeLocal(record.check_in_at));
  const [checkOutAt, setCheckOutAt] = useState(toDatetimeLocal(record.check_out_at));
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = reason.trim().length > 0 && (
    checkInAt !== toDatetimeLocal(record.check_in_at) ||
    checkOutAt !== toDatetimeLocal(record.check_out_at)
  );

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);

    try {
      const payload: { check_in_at?: string; check_out_at?: string; reason: string } = {
        reason: reason.trim(),
      };

      if (checkInAt !== toDatetimeLocal(record.check_in_at)) {
        payload.check_in_at = fromDatetimeLocal(checkInAt);
      }
      if (checkOutAt !== toDatetimeLocal(record.check_out_at)) {
        payload.check_out_at = fromDatetimeLocal(checkOutAt);
      }

      const updated = await adjustRecord(record.id, payload);
      // Merge updated fields into the full record (preserve joined users field)
      onSaved({ ...record, ...updated });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save adjustment');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Adjust Record</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Check-in Time
            </label>
            <input
              type="datetime-local"
              value={checkInAt}
              onChange={(e) => setCheckInAt(e.target.value)}
              className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Check-out Time
            </label>
            <input
              type="datetime-local"
              value={checkOutAt}
              onChange={(e) => setCheckOutAt(e.target.value)}
              className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this record is being adjusted..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5] resize-none"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{reason.length}/500</p>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <button
            onClick={onClose}
            className="border border-slate-300 text-slate-700 rounded-lg h-10 px-4 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="bg-[#4848e5] hover:bg-[#4848e5]/90 text-white rounded-lg h-10 px-4 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Adjustment'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
