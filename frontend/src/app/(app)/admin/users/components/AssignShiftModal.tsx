'use client';

import { useEffect, useState } from 'react';
import { getStoredToken } from '@/lib/api/auth';
import { User } from '@/lib/api/users';
import {
  Shift,
  ShiftAssignment,
  listShifts,
  assignShift,
  getUserShiftInfo,
} from '@/lib/api/shifts';

interface AssignShiftModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignShiftModal({
  open,
  user,
  onClose,
  onAssigned,
}: AssignShiftModalProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [activeShift, setActiveShift] = useState<ShiftAssignment | null>(null);
  const [history, setHistory] = useState<ShiftAssignment[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;

    const token = getStoredToken();
    if (!token) return;

    setError(null);
    setSelectedShiftId('');
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setLoadingData(true);

    Promise.all([listShifts(token, 1, 1000), getUserShiftInfo(token, user.id)])
      .then(([shiftResult, shiftInfo]) => {
        setShifts(shiftResult.data);
        setActiveShift(shiftInfo.activeShift);
        setHistory(shiftInfo.history);
        if (shiftResult.data.length > 0) {
          setSelectedShiftId(shiftResult.data[0].id);
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load shift data';
        setError(message);
      })
      .finally(() => {
        setLoadingData(false);
      });
  }, [open, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !selectedShiftId || !effectiveDate) return;

    const token = getStoredToken();
    if (!token) return;

    setSubmitting(true);
    setError(null);

    try {
      await assignShift(token, {
        userId: user.id,
        shiftId: selectedShiftId,
        effectiveDate,
      });
      onAssigned();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to assign shift';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Assign Shift</h2>
            <p className="text-sm text-gray-500 mt-0.5">{user.full_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current active shift */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Current Shift</h3>
            {loadingData ? (
              <div className="text-sm text-gray-400">Loading...</div>
            ) : activeShift ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
                <span className="font-medium">{activeShift.shifts.name}</span>
                {' '}
                ({activeShift.shifts.start_time}–{activeShift.shifts.end_time})
                <span className="ml-2 text-blue-600 text-xs">
                  since {activeShift.effective_date}
                </span>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500">
                No shift assigned
              </div>
            )}
          </div>

          {/* Assignment form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift
              </label>
              <select
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {shifts.length === 0 ? (
                  <option value="">No shifts available</option>
                ) : (
                  shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.start_time}–{s.end_time})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effective Date
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || shifts.length === 0}
                className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Assigning...' : 'Assign Shift'}
              </button>
            </div>
          </form>

          {/* Assignment history */}
          {!loadingData && history.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Assignment History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2 pr-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shift Name
                      </th>
                      <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Effective Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="py-2 pr-4 text-gray-900">
                          {assignment.shifts.name}
                        </td>
                        <td className="py-2 text-gray-600">
                          {assignment.effective_date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
