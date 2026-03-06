'use client';

import { Shift } from '@/lib/api/shifts';
import { Pencil } from 'lucide-react';

interface ShiftTableProps {
  shifts: Shift[];
  onEdit: (shift: Shift) => void;
}

export default function ShiftTable({ shifts, onEdit }: ShiftTableProps) {
  if (shifts.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8 text-center">
        <p className="text-slate-500">No shifts defined yet. Create your first shift.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Shift Name
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Start Time
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                End Time
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Grace Period
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Morning End
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Afternoon Start
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {shifts.map((shift) => (
              <tr key={shift.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-slate-900 text-sm font-medium whitespace-nowrap">
                  {shift.name}
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                  {shift.start_time}
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                  {shift.end_time}
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                    {shift.grace_period_minutes} mins
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                  {shift.morning_end_time?.slice(0, 5) ?? <span className="text-slate-400">-</span>}
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                  {shift.afternoon_start_time?.slice(0, 5) ?? <span className="text-slate-400">-</span>}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <button
                    onClick={() => onEdit(shift)}
                    className="text-[#4848e5] hover:text-[#4848e5]/80 text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
