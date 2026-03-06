'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, getStoredUser } from '@/lib/api/auth';
import { Division, listDivisions, deleteDivision } from '@/lib/api/divisions';
import { User, listUsers } from '@/lib/api/users';
import { DivisionTable } from './components/DivisionTable';
import { CreateDivisionModal } from './components/CreateDivisionModal';
import { EditDivisionModal } from './components/EditDivisionModal';
import { PaginationControls } from '@/components/PaginationControls';
import { Plus, Search } from 'lucide-react';

const LIMIT = 20;

export default function DivisionsPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Access guard: admin/owner only
  const currentUser = getStoredUser();
  if (currentUser && !['owner', 'admin'].includes(currentUser.role)) {
    return (
      <div className="p-8 text-center text-red-600 font-medium">
        Access denied. Admin or Owner role required.
      </div>
    );
  }

  const [total, setTotal] = useState(0);

  async function refresh(p = page) {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [divsResult, usersResult] = await Promise.all([listDivisions(token, p, LIMIT), listUsers(token, 1, 1000)]);
      setDivisions(divsResult.data);
      setTotal(divsResult.total);
      setManagers(usersResult.data.filter((u) => u.role === 'manager'));
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load divisions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="max-w-[1200px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-slate-900 text-2xl font-bold leading-tight tracking-tight">Division Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage organizational divisions and their assigned managers.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search divisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-52 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4848e5]/50 focus:border-[#4848e5] placeholder-slate-400 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg h-10 px-5 bg-[#4848e5] text-white text-sm font-medium shadow-sm hover:bg-[#4848e5]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Division</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#4848e5] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <DivisionTable
            divisions={searchQuery.trim() ? divisions.filter((d) => { const q = searchQuery.toLowerCase(); return d.name.toLowerCase().includes(q) || (d.users?.full_name?.toLowerCase().includes(q) ?? false); }) : divisions}
            onEdit={setEditingDivision}
            onDelete={handleDelete}
          />
          {total > LIMIT && (
            <PaginationControls page={page} limit={LIMIT} total={total} onPageChange={setPage} />
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
