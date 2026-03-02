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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (shift) {
      setName(shift.name);
      setStartTime(shift.start_time.slice(0, 5));
      setEndTime(shift.end_time.slice(0, 5));
      setGracePeriodMinutes(shift.grace_period_minutes);
    } else {
      setName('');
      setStartTime('');
      setEndTime('');
      setGracePeriodMinutes(0);
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

      if (isEditMode && shift) {
        await updateShift(token, shift.id, { name, startTime, endTime, gracePeriodMinutes });
      } else {
        await createShift(token, { name, startTime, endTime, gracePeriodMinutes });
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
