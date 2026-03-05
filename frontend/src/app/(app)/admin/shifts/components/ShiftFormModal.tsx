'use client';

import { useState, useEffect } from 'react';
import { Shift, createShift, updateShift } from '@/lib/api/shifts';
import { getStoredToken } from '@/lib/api/auth';

interface ShiftFormModalProps {
  open: boolean;
  shift?: Shift | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ShiftFormModal({ open, shift, onClose, onSaved }: ShiftFormModalProps) {
  const isEditMode = !!shift;

  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(0);
  const [morningEndTime, setMorningEndTime] = useState('');
  const [afternoonStartTime, setAfternoonStartTime] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (shift) {
      setName(shift.name);
      setStartTime(shift.start_time.slice(0, 5));
      setEndTime(shift.end_time.slice(0, 5));
      setGracePeriodMinutes(shift.grace_period_minutes);
      setMorningEndTime(shift.morning_end_time?.slice(0, 5) ?? '');
      setAfternoonStartTime(shift.afternoon_start_time?.slice(0, 5) ?? '');
    } else {
      setName('');
      setStartTime('');
      setEndTime('');
      setGracePeriodMinutes(0);
      setMorningEndTime('');
      setAfternoonStartTime('');
    }
    setError('');
  }, [shift, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = getStoredToken();
      if (!token) throw new Error('Not authenticated');

      // Validate split-day windows: both must be set together or both empty
      const hasMorningEnd = !!morningEndTime;
      const hasAfternoonStart = !!afternoonStartTime;
      if (hasMorningEnd !== hasAfternoonStart) {
        throw new Error('Morning End and Afternoon Start must both be set or both be empty');
      }
      if (hasMorningEnd && hasAfternoonStart) {
        const [mh, mm] = morningEndTime.split(':').map(Number);
        const [ah, am] = afternoonStartTime.split(':').map(Number);
        if (ah * 60 + am <= mh * 60 + mm) {
          throw new Error('Afternoon Start must be after Morning End');
        }
      }

      if (isEditMode && shift) {
        await updateShift(token, shift.id, {
          name, startTime, endTime, gracePeriodMinutes,
          morningEndTime: morningEndTime || null,
          afternoonStartTime: afternoonStartTime || null,
        });
      } else {
        await createShift(token, {
          name, startTime, endTime, gracePeriodMinutes,
          morningEndTime: morningEndTime || null,
          afternoonStartTime: afternoonStartTime || null,
        });
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      {/* Modal card */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {isEditMode ? 'Edit Shift' : 'Create Shift'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="shift-name" className="block text-sm font-medium text-gray-700 mb-1">
              Shift Name
            </label>
            <input
              id="shift-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g. Morning Shift"
            />
          </div>

          <div>
            <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              id="start-time"
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              id="end-time"
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="grace-period" className="block text-sm font-medium text-gray-700 mb-1">
              Grace Period (minutes)
            </label>
            <input
              id="grace-period"
              type="number"
              min={0}
              max={120}
              step={1}
              placeholder="0"
              value={gracePeriodMinutes}
              onChange={(e) => setGracePeriodMinutes(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Split-Day Windows (Optional)</p>
            <p className="text-xs text-gray-500 mb-3">Set both fields to enable half-day tracking. Check-in after Afternoon Start marks absent morning; check-out before Morning End marks absent afternoon.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="morning-end-time" className="block text-sm font-medium text-gray-700 mb-1">
                  Morning End
                </label>
                <input
                  id="morning-end-time"
                  type="time"
                  value={morningEndTime}
                  onChange={(e) => setMorningEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="afternoon-start-time" className="block text-sm font-medium text-gray-700 mb-1">
                  Afternoon Start
                </label>
                <input
                  id="afternoon-start-time"
                  type="time"
                  value={afternoonStartTime}
                  onChange={(e) => setAfternoonStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
