'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, getStoredUser } from '@/lib/api/auth';
import { Division, listDivisions, deleteDivision } from '@/lib/api/divisions';
import { User, listUsers } from '@/lib/api/users';
import { DivisionTable } from './components/DivisionTable';
import { CreateDivisionModal } from './components/CreateDivisionModal';
import { EditDivisionModal } from './components/EditDivisionModal';
import { PaginationControls } from '@/components/PaginationControls';

const LIMIT = 20;

export default function DivisionsPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [page, setPage] = useState(1);

  // Access guard: admin/owner only
  const currentUser = getStoredUser();
  if (currentUser && !['owner', 'admin'].includes(currentUser.role)) {
    return (
      <div className="p-8 text-center text-red-600 font-medium">
        Access denied. Admin or Owner role required.
      </div>
    );
  }

  async function refresh() {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [divs, usersResult] = await Promise.all([listDivisions(token), listUsers(token, 1, 1000)]);
      setDivisions(divs);
      setManagers(usersResult.data.filter((u) => u.role === 'manager'));
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load divisions');
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); }, []);

  async function handleDelete(id: string) {
    const token = getStoredToken();
    if (!token) return;
    try {
      await deleteDivision(token, id);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete division');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Division Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Division
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <DivisionTable
            divisions={divisions.slice((page - 1) * LIMIT, page * LIMIT)}
            onEdit={setEditingDivision}
            onDelete={handleDelete}
          />
          {divisions.length > LIMIT && (
            <PaginationControls page={page} limit={LIMIT} total={divisions.length} onPageChange={setPage} />
          )}
        </>
      )}

      <CreateDivisionModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={refresh}
        managers={managers}
      />

      <EditDivisionModal
        open={!!editingDivision}
        division={editingDivision}
        onClose={() => setEditingDivision(null)}
        onUpdated={refresh}
        managers={managers}
      />
    </div>
  );
}
