'use client';

import { Division } from '@/lib/api/divisions';

interface DivisionTableProps {
  divisions: Division[];
  onEdit: (d: Division) => void;
  onDelete: (id: string) => void;
}

export function DivisionTable({ divisions, onEdit, onDelete }: DivisionTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Manager
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {divisions.map((division) => (
            <tr key={division.id}>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {division.name}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {division.users?.full_name ?? '—'}
              </td>
              <td className="px-4 py-3 text-sm">
                <button
                  onClick={() => onEdit(division)}
                  className="text-indigo-600 hover:text-indigo-800 underline mr-4"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(division.id)}
                  className="text-red-600 hover:text-red-800 underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {divisions.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                No divisions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
