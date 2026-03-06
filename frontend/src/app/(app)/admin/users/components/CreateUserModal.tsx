'use client';

import { useState } from 'react';
import { User, CreateUserData, createUser } from '@/lib/api/users';
import { Division } from '@/lib/api/divisions';
import { getStoredToken } from '@/lib/api/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const ROLE_OPTIONS: User['role'][] = ['admin', 'manager', 'employee', 'executive'];

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  managers: User[];
  divisions: Division[];
  currentUserId: string;
  currentUserRole: string;
}

export function CreateUserModal({
  open,
  onClose,
  onCreated,
  managers,
  divisions,
  currentUserId,
  currentUserRole,
}: CreateUserModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('employee');
  const [managerId, setManagerId] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableDivisions = currentUserRole === 'manager'
    ? divisions.filter((d) => d.manager_id === currentUserId)
    : divisions;

  function resetForm() {
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('employee');
    setManagerId('');
    setDivisionId('');
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setError('Not authenticated.');
      return;
    }

    const data: CreateUserData = {
      fullName,
      email,
      password,
      role: currentUserRole === 'manager' ? 'employee' : role,
    };
    if (role === 'employee' && managerId) {
      data.managerId = managerId;
    }
    if (divisionId) {
      data.divisionId = divisionId;
    }

    setLoading(true);
    try {
      await createUser(token, data);
      resetForm();
      onCreated();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
              placeholder="Nguyen Van A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
              placeholder="user@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
              placeholder="Min 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Role
            </label>
            {currentUserRole === 'manager' ? (
              <div className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm bg-slate-50 text-slate-600 flex items-center">
                Employee (Managers can only create employees)
              </div>
            ) : (
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {role === 'employee' && (
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
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Division (optional)
            </label>
            <select
              value={divisionId}
              onChange={(e) => setDivisionId(e.target.value)}
              className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
            >
              <option value="">No division</option>
              {availableDivisions.map((div) => (
                <option key={div.id} value={div.id}>
                  {div.name}
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
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
