'use client';

import { User } from '@/lib/api/users';

const ROLE_OPTIONS: User['role'][] = ['owner', 'admin', 'manager', 'employee', 'executive'];

interface UserTableProps {
  users: User[];
  onRoleChange: (id: string, role: string) => void;
  onStatusToggle: (id: string, isActive: boolean) => void;
  onManagerChange: (id: string, managerId: string | null) => void;
  onAssignShift: (user: User) => void;
}

export function UserTable({
  users,
  onRoleChange,
  onStatusToggle,
  onManagerChange,
  onAssignShift,
}: UserTableProps) {
  const managers = users.filter((u) => u.role === 'manager');

  function getManagerName(managerId: string | null): string {
    if (!managerId) return '—';
    const mgr = users.find((u) => u.id === managerId);
    return mgr ? mgr.full_name : '—';
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Manager
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((user) => (
            <tr
              key={user.id}
              className={user.is_active ? '' : 'opacity-50 bg-gray-50'}
            >
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {user.full_name}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
              <td className="px-4 py-3 text-sm">
                <select
                  value={user.role}
                  disabled={user.role === 'owner'}
                  onChange={(e) => onRoleChange(user.id, e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {getManagerName(user.manager_id)}
              </td>
              <td className="px-4 py-3 text-sm">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {user.is_active ? 'Active' : 'Disabled'}
                </span>
                <button
                  onClick={() => onStatusToggle(user.id, !user.is_active)}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  {user.is_active ? 'Disable' : 'Enable'}
                </button>
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="flex flex-col gap-2">
                  <select
                    value={user.manager_id ?? ''}
                    onChange={(e) =>
                      onManagerChange(user.id, e.target.value || null)
                    }
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No manager</option>
                    {managers.map((mgr) => (
                      <option key={mgr.id} value={mgr.id}>
                        {mgr.full_name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => onAssignShift(user)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 underline text-left"
                  >
                    Assign Shift
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
