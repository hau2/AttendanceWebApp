'use client';

import { useEffect, useState } from 'react';
import { Shift, listShifts } from '@/lib/api/shifts';
import { getStoredToken, getStoredUser } from '@/lib/api/auth';
import ShiftTable from './components/ShiftTable';
import ShiftFormModal from './components/ShiftFormModal';
import { PaginationControls } from '@/components/PaginationControls';

const LIMIT = 20;

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const user = getStoredUser();

  // Access control: only owners and admins can manage shifts
  if (user && !['owner', 'admin'].includes(user.role)) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <p className="text-red-700 font-medium">Access denied</p>
          <p className="text-red-500 text-sm mt-1">You do not have permission to manage shifts.</p>
        </div>
      </div>
    );
  }

  async function loadShifts(p = page) {
    setLoading(true);
    setError('');
    try {
      const token = getStoredToken();
      if (!token) throw new Error('Not authenticated');
      const result = await listShifts(token, p, LIMIT);
      setShifts(result.data);
      setTotal(result.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShifts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleCreate() {
    setEditingShift(null);
    setShowModal(true);
  }

  function handleEdit(shift: Shift) {
    setEditingShift(shift);
    setShowModal(true);
  }

  function handleModalClose() {
    setShowModal(false);
    setEditingShift(null);
  }

  async function handleSaved() {
    await loadShifts(page);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create Shift
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">Loading shifts...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <ShiftTable shifts={shifts} onEdit={handleEdit} />
          {total > LIMIT && (
            <div className="mt-2 bg-white rounded-lg shadow-sm">
              <PaginationControls page={page} limit={LIMIT} total={total} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      <ShiftFormModal
        open={showModal}
        shift={editingShift}
        onClose={handleModalClose}
        onSaved={handleSaved}
      />
    </div>
  );
}
