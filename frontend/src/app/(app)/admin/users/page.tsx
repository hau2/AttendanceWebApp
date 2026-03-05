'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, getStoredUser } from '@/lib/api/auth';
import {
  User,
  listUsers,
  updateUser,
  setUserStatus,
  deleteUser,
} from '@/lib/api/users';
import { Division, listDivisions } from '@/lib/api/divisions';
import { UserTable } from './components/UserTable';
import { CreateUserModal } from './components/CreateUserModal';
import { CsvImportModal } from './components/CsvImportModal';
import { AssignShiftModal } from './components/AssignShiftModal';
import { EditUserModal } from './components/EditUserModal';
import { PaginationControls } from '@/components/PaginationControls';

const LIMIT = 20;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [assigningUser, setAssigningUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const currentUser = getStoredUser();
  if (currentUser && !['owner', 'admin'].includes(currentUser.role)) {
    return (
      <div className="p-8 text-center text-red-600 font-medium">
        Access denied. Admin or Owner role required.
      </div>
    );
  }

  async function refreshUsers(p = page) {
    const token = getStoredToken();
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }
    try {
      const [result, divs] = await Promise.all([listUsers(token, p, LIMIT), listDivisions(token)]);
      setUsers(result.data);
      setTotal(result.total);
      setDivisions(divs);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load users';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshUsers(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function handleRoleChange(id: string, role: string) {
    const token = getStoredToken();
    if (!token) return;
    try {
      await updateUser(token, id, { role });
      await refreshUsers(1);
      setPage(1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update role';
      setError(message);
    }
  }

  async function handleStatusToggle(id: string, isActive: boolean) {
    const token = getStoredToken();
    if (!token) return;
    try {
      await setUserStatus(token, id, isActive);
      await refreshUsers(1);
      setPage(1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      setError(message);
    }
  }

  async function handleManagerChange(id: string, managerId: string | null) {
    const token = getStoredToken();
    if (!token) return;
    try {
      await updateUser(token, id, { managerId: managerId ?? undefined });
      await refreshUsers(1);
      setPage(1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update manager';
      setError(message);
    }
  }

  async function handleDivisionChange(id: string, divisionId: string | null) {
    const token = getStoredToken();
    if (!token) return;
    try {
      await updateUser(token, id, { divisionId: divisionId ?? undefined });
      await refreshUsers(1);
      setPage(1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update division';
      setError(message);
    }
  }

  async function handleDelete(user: User) {
    if (!confirm(`Delete ${user.full_name}? Their attendance history will be preserved.`)) return;
    const token = getStoredToken();
    if (!token) return;
    try {
      await deleteUser(token, user.id);
      await refreshUsers(1);
      setPage(1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  }

  const managers = users.filter((u) => u.role === 'manager');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCsvModal(true)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Import CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add User
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
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <UserTable
            users={users}
            divisions={divisions}
            currentUserRole={currentUser?.role ?? ''}
            onRoleChange={handleRoleChange}
            onStatusToggle={handleStatusToggle}
            onManagerChange={handleManagerChange}
            onDivisionChange={handleDivisionChange}
            onAssignShift={setAssigningUser}
            onEdit={setEditingUser}
            onDelete={handleDelete}
          />
          <PaginationControls page={page} limit={LIMIT} total={total} onPageChange={(p) => { setPage(p); refreshUsers(p); }} />
        </>
      )}

      <CreateUserModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => { refreshUsers(1); setPage(1); }}
        managers={managers}
        divisions={divisions}
        currentUserId={currentUser?.id ?? ''}
        currentUserRole={currentUser?.role ?? 'admin'}
      />

      <CsvImportModal
        open={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onImported={() => { refreshUsers(1); setPage(1); }}
      />

      <AssignShiftModal
        open={!!assigningUser}
        user={assigningUser}
        onClose={() => setAssigningUser(null)}
        onAssigned={() => { refreshUsers(page); }}
      />

      <EditUserModal
        open={!!editingUser}
        user={editingUser}
        divisions={divisions}
        onClose={() => setEditingUser(null)}
        onSaved={() => { refreshUsers(1); setPage(1); }}
      />
    </div>
  );
}
