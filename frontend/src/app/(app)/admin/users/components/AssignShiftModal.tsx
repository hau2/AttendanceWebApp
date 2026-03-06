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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

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

  return (
    <Dialog open={open && !!user} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" showCloseButton>
        <DialogHeader>
          <DialogTitle>Assign Shift</DialogTitle>
          {user && <DialogDescription>{user.full_name}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-6">
          {/* Current active shift */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Current Shift</h3>
            {loadingData ? (
              <div className="text-sm text-slate-400">Loading...</div>
            ) : activeShift ? (
              <div className="bg-[#4848e5]/10 border border-[#4848e5]/20 rounded-lg px-4 py-3 text-sm text-[#4848e5]">
                <span className="font-medium">{activeShift.shifts.name}</span>
                {' '}
                ({activeShift.shifts.start_time}--{activeShift.shifts.end_time})
                <span className="ml-2 text-[#4848e5]/70 text-xs">
                  since {activeShift.effective_date}
                </span>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-500">
                No shift assigned
              </div>
            )}
          </div>

          {/* Assignment form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Shift
              </label>
              <select
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
              >
                {shifts.length === 0 ? (
                  <option value="">No shifts available</option>
                ) : (
                  shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.start_time}--{s.end_time})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Effective Date
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="border border-slate-300 text-slate-700 rounded-lg h-10 px-4 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || shifts.length === 0}
                className="bg-[#4848e5] hover:bg-[#4848e5]/90 text-white rounded-lg h-10 px-4 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Assigning...' : 'Assign Shift'}
              </button>
            </DialogFooter>
          </form>

          {/* Assignment history */}
          {!loadingData && history.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">Assignment History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-2 pr-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Shift Name
                      </th>
                      <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Effective Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="py-2 pr-4 text-slate-900">
                          {assignment.shifts.name}
                        </td>
                        <td className="py-2 text-slate-600">
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
      </DialogContent>
    </Dialog>
  );
}
