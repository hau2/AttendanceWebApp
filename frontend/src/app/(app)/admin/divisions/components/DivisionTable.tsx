'use client';

import { Division } from '@/lib/api/divisions';
import { Pencil, Trash2 } from 'lucide-react';

interface DivisionTableProps {
  divisions: Division[];
  onEdit: (d: Division) => void;
  onDelete: (id: string) => void;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

export function DivisionTable({ divisions, onEdit, onDelete }: DivisionTableProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">
                Division Name
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">
                Manager
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {divisions.map((division) => (
              <tr key={division.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <span className="text-slate-900 text-sm font-semibold">{division.name}</span>
                </td>
                <td className="px-6 py-4">
                  {division.users?.full_name ? (
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                        {getInitials(division.users.full_name)}
                      </div>
                      <span className="text-slate-600 text-sm">{division.users.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm italic">-- Unassigned --</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => onEdit(division)}
                      className="text-[#4848e5] hover:text-[#4848e5]/80 text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(division.id)}
                      className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {divisions.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-500">
                  No divisions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
