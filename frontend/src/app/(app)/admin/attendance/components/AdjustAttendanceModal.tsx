'use client';

import { useState } from 'react';
import { AttendanceRecordWithUser, adjustRecord } from '@/lib/api/attendance';

interface Props {
  record: AttendanceRecordWithUser;
  onClose: () => void;
  onSaved: (updated: AttendanceRecordWithUser) => void;
}

/**
 * Convert an ISO timestamp to the value needed by <input type="datetime-local">.
 * datetime-local expects "YYYY-MM-DDTHH:MM" (no seconds, no timezone suffix).
 */
function toDatetimeLocal(isoStr: string | null): string {
  if (!isoStr) return '';
  // Slice to "YYYY-MM-DDTHH:MM"
  return isoStr.slice(0, 16);
}

/**
 * Convert datetime-local value back to full ISO string for the backend.
 * Appends ":00.000Z" to satisfy IsISO8601 validation.
 * Note: This assumes the admin is entering times in UTC context.
 * For v1 this is acceptable — admins understand their timezone offset.
 */
function fromDatetimeLocal(localStr: string): string {
  if (!localStr) return '';
  return localStr + ':00.000Z';
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Adjust Record</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check-in Time
            </label>
            <input
              type="datetime-local"
              value={checkInAt}
              onChange={(e) => setCheckInAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check-out Time
            </label>
            <input
              type="datetime-local"
              value={checkOutAt}
              onChange={(e) => setCheckOutAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this record is being adjusted..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{reason.length}/500</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Adjustment'}
          </button>
        </div>
      </div>
    </div>
  );
}
