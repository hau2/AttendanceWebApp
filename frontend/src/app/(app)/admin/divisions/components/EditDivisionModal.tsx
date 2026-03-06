'use client';

import { useEffect, useState } from 'react';
import { User } from '@/lib/api/users';
import { Division, UpdateDivisionData, updateDivision } from '@/lib/api/divisions';
import { getStoredToken } from '@/lib/api/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface EditDivisionModalProps {
  open: boolean;
  division: Division | null;
  onClose: () => void;
  onUpdated: () => void;
  managers: User[];
}

export function EditDivisionModal({
  open,
  division,
  onClose,
  onUpdated,
  managers,
}: EditDivisionModalProps) {
  const [name, setName] = useState('');
  const [managerId, setManagerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (division) {
      setName(division.name);
      setManagerId(division.manager_id ?? '');
      setError(null);
    }
  }, [division]);

  function handleClose() {
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!division) return;

    const token = getStoredToken();
    if (!token) {
      setError('Not authenticated.');
      return;
    }

    const data: UpdateDivisionData = {
      name,
      managerId: managerId || null,
    };

    setLoading(true);
    try {
      await updateDivision(token, division.id, data);
      onUpdated();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update division';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open && !!division} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Edit Division</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Division Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Manager (optional)
            </label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
            >
              <option value="">No manager</option>
              {managers.map((mgr) => (
                <option key={mgr.id} value={mgr.id}>
                  {mgr.full_name}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="border border-slate-300 text-slate-700 rounded-lg h-10 px-4 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#4848e5] hover:bg-[#4848e5]/90 text-white rounded-lg h-10 px-4 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
