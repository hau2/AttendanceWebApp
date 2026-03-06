'use client';

import { User } from '@/lib/api/users';
import { Division } from '@/lib/api/divisions';
import { Pencil, CalendarPlus, Trash2 } from 'lucide-react';

interface UserTableProps {
  users: User[];
  divisions: Division[];
  currentUserRole: string;
  onRoleChange: (id: string, role: string) => void;
  onStatusToggle: (id: string, isActive: boolean) => void;
  onManagerChange: (id: string, managerId: string | null) => void;
  onDivisionChange: (id: string, divisionId: string | null) => void;
  onAssignShift: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

function getRoleBadgeClasses(role: string): string {
  switch (role) {
    case 'admin':
    case 'owner':
      return 'bg-[#4848e5]/10 text-[#4848e5]';
    case 'manager':
      return 'bg-indigo-100 text-indigo-800';
    case 'executive':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

function getDisabledRoleBadgeClasses(): string {
  return 'bg-slate-100 text-slate-500';
}

export function UserTable({
  users,
  divisions,
  currentUserRole,
  onStatusToggle,
  onAssignShift,
  onEdit,
  onDelete,
}: UserTableProps) {
  const isAdminOrOwner = ['admin', 'owner'].includes(currentUserRole);

  function getDivisionName(divisionId: string | null): string {
    if (!divisionId) return '\u2014';
    const div = divisions.find((d) => d.id === divisionId);
    return div ? div.name : '\u2014';
  }

  return (
    <>
      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {users.map((user) => {
          const isDisabled = !user.is_active;
          return (
            <div
              key={user.id}
              className={`rounded-xl border border-slate-200 bg-white p-4 ${isDisabled ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-semibold truncate ${isDisabled ? 'text-slate-500' : 'text-slate-900'}`}>
                    {user.full_name}
                  </div>
                  <div className={`text-xs truncate mt-0.5 ${isDisabled ? 'text-slate-400' : 'text-slate-500'}`}>
                    {user.email}
                  </div>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {user.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isDisabled ? getDisabledRoleBadgeClasses() : getRoleBadgeClasses(user.role)
                  }`}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                {user.division_id && (
                  <span className="text-xs text-slate-500">
                    {getDivisionName(user.division_id)}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3">
                {isAdminOrOwner && (
                  <button
                    onClick={() => onEdit(user)}
                    className={`${isDisabled ? 'text-slate-400 hover:text-slate-600' : 'text-[#4848e5] hover:text-[#4848e5]/80'} transition-colors`}
                    title="Edit"
                  >
                    <Pencil className="w-[18px] h-[18px]" />
                  </button>
                )}
                <button
                  onClick={() => onAssignShift(user)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  title="Assign Shift"
                >
                  <CalendarPlus className="w-[18px] h-[18px]" />
                </button>
                {isAdminOrOwner && user.role !== 'owner' && (
                  <button
                    onClick={() => onDelete(user)}
                    className={`${isDisabled ? 'text-slate-400 hover:text-red-500' : 'text-red-500 hover:text-red-700'} transition-colors`}
                    title="Delete"
                  >
                    <Trash2 className="w-[18px] h-[18px]" />
                  </button>
                )}
                {isAdminOrOwner && (
                  <button
                    onClick={() => onStatusToggle(user.id, !user.is_active)}
                    className="ml-auto text-xs text-[#4848e5] hover:text-[#4848e5]/80 underline"
                  >
                    {user.is_active ? 'Disable' : 'Enable'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {users.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            No users found.
          </div>
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Division</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Manager</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((user) => {
              const isDisabled = !user.is_active;
              return (
                <tr
                  key={user.id}
                  className={
                    isDisabled
                      ? 'opacity-60 bg-slate-50/50'
                      : 'hover:bg-slate-50 transition-colors'
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-semibold ${isDisabled ? 'text-slate-500' : 'text-slate-900'}`}>
                      {user.full_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className={`text-sm ${isDisabled ? 'text-slate-500' : 'text-slate-600'}`}>
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isDisabled ? getDisabledRoleBadgeClasses() : getRoleBadgeClasses(user.role)
                      }`}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className={`text-sm ${isDisabled ? 'text-slate-500' : 'text-slate-600'}`}>
                      {getDivisionName(user.division_id)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className={`text-sm ${isDisabled ? 'text-slate-500' : 'text-slate-600'}`}>
                      {user.divisions?.users?.full_name ?? '\u2014'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Disabled'}
                    </span>
                    {isAdminOrOwner && (
                      <button
                        onClick={() => onStatusToggle(user.id, !user.is_active)}
                        className="ml-2 text-xs text-[#4848e5] hover:text-[#4848e5]/80 underline"
                      >
                        {user.is_active ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      {isAdminOrOwner && (
                        <button
                          onClick={() => onEdit(user)}
                          className={`${isDisabled ? 'text-slate-400 hover:text-slate-600' : 'text-[#4848e5] hover:text-[#4848e5]/80'} transition-colors`}
                          title="Edit"
                        >
                          <Pencil className="w-[18px] h-[18px]" />
                        </button>
                      )}
                      <button
                        onClick={() => onAssignShift(user)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title="Assign Shift"
                      >
                        <CalendarPlus className="w-[18px] h-[18px]" />
                      </button>
                      {isAdminOrOwner && user.role !== 'owner' && (
                        <button
                          onClick={() => onDelete(user)}
                          className={`${isDisabled ? 'text-slate-400 hover:text-red-500' : 'text-red-500 hover:text-red-700'} transition-colors`}
                          title="Delete"
                        >
                          <Trash2 className="w-[18px] h-[18px]" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}
