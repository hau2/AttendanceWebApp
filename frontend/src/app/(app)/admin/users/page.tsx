'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, getStoredUser } from '@/lib/api/auth';
import {
  User,
  listUsers,
  updateUser,
  setUserStatus,
} from '@/lib/api/users';
import { UserTable } from './components/UserTable';
import { CreateUserModal } from './components/CreateUserModal';
import { CsvImportModal } from './components/CsvImportModal';
import { AssignShiftModal } from './components/AssignShiftModal';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [assigningUser, setAssigningUser] = useState<User | null>(null);

  const currentUser = getStoredUser();
  if (currentUser && !['owner', 'admin'].includes(currentUser.role)) {
    return (
      <div className="p-8 text-center text-red-600 font-medium">
        Access denied. Admin or Owner role required.
      </div>
    );
  }

  async function refreshUsers() {
    const token = getStoredToken();
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }
    try {
      const data = await listUsers(token);
      setUsers(data);
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

  async function handleRoleChange(id: string, role: string) {
    const token = getStoredToken();
    if (!token) return;
    try {
      await updateUser(token, id, { role });
      await refreshUsers();
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
      await refreshUsers();
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
      await refreshUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update manager';
      setError(message);
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
        <UserTable
          users={users}
          onRoleChange={handleRoleChange}
          onStatusToggle={handleStatusToggle}
          onManagerChange={handleManagerChange}
          onAssignShift={setAssigningUser}
        />
      )}

      <CreateUserModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={refreshUsers}
        managers={managers}
      />

      <CsvImportModal
        open={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onImported={refreshUsers}
      />

      <AssignShiftModal
        open={!!assigningUser}
        user={assigningUser}
        onClose={() => setAssigningUser(null)}
        onAssigned={refreshUsers}
      />
    </div>
  );
}
