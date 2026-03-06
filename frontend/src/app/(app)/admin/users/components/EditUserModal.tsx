'use client';

import { useState, useEffect } from 'react';
import { getStoredToken } from '@/lib/api/auth';
import { User, updateUser } from '@/lib/api/users';
import { Division } from '@/lib/api/divisions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface EditUserModalProps {
  open: boolean;
  user: User | null;
  divisions: Division[];
  onClose: () => void;
  onSaved: () => void;
}

export function EditUserModal({ open, user, divisions, onClose, onSaved }: EditUserModalProps) {
  const [fullName, setFullName] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [timezone, setTimezone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setDivisionId(user.division_id ?? '');
      setTimezone(user.timezone ?? '');
      setError(null);
    }
  }, [user]);

  async function handleSave() {
    const token = getStoredToken();
    if (!token || !user) return;
    setSaving(true);
    setError(null);
    try {
      await updateUser(token, user.id, {
        fullName: fullName.trim(),
        divisionId: divisionId || undefined,
        timezone: timezone || null,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open && !!user} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Division</label>
            <select
              value={divisionId}
              onChange={(e) => setDivisionId(e.target.value)}
              className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
            >
              <option value="">No division</option>
              {divisions.map((div) => (
                <option key={div.id} value={div.id}>{div.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Personal Timezone <span className="text-slate-400 font-normal">(optional — overrides company timezone)</span>
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
            >
              <option value="">Use company timezone</option>
              <optgroup label="Asia">
                <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (Vietnam)</option>
                <option value="Asia/Bangkok">Asia/Bangkok (Thailand)</option>
                <option value="Asia/Singapore">Asia/Singapore</option>
                <option value="Asia/Jakarta">Asia/Jakarta (Indonesia WIB)</option>
                <option value="Asia/Makassar">Asia/Makassar (Indonesia WITA)</option>
                <option value="Asia/Jayapura">Asia/Jayapura (Indonesia WIT)</option>
                <option value="Asia/Manila">Asia/Manila (Philippines)</option>
                <option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (Malaysia)</option>
                <option value="Asia/Yangon">Asia/Yangon (Myanmar)</option>
                <option value="Asia/Phnom_Penh">Asia/Phnom_Penh (Cambodia)</option>
                <option value="Asia/Vientiane">Asia/Vientiane (Laos)</option>
                <option value="Asia/Shanghai">Asia/Shanghai (China)</option>
                <option value="Asia/Hong_Kong">Asia/Hong_Kong</option>
                <option value="Asia/Taipei">Asia/Taipei (Taiwan)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (Japan)</option>
                <option value="Asia/Seoul">Asia/Seoul (South Korea)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (India)</option>
                <option value="Asia/Dhaka">Asia/Dhaka (Bangladesh)</option>
                <option value="Asia/Karachi">Asia/Karachi (Pakistan)</option>
                <option value="Asia/Dubai">Asia/Dubai (UAE)</option>
                <option value="Asia/Riyadh">Asia/Riyadh (Saudi Arabia)</option>
              </optgroup>
              <optgroup label="Australia &amp; Pacific">
                <option value="Australia/Sydney">Australia/Sydney</option>
                <option value="Australia/Melbourne">Australia/Melbourne</option>
                <option value="Australia/Brisbane">Australia/Brisbane</option>
                <option value="Australia/Perth">Australia/Perth</option>
                <option value="Pacific/Auckland">Pacific/Auckland (New Zealand)</option>
              </optgroup>
              <optgroup label="Europe">
                <option value="Europe/London">Europe/London (UK)</option>
                <option value="Europe/Paris">Europe/Paris (France)</option>
                <option value="Europe/Berlin">Europe/Berlin (Germany)</option>
                <option value="Europe/Moscow">Europe/Moscow (Russia)</option>
              </optgroup>
              <optgroup label="Americas">
                <option value="America/New_York">America/New_York (US Eastern)</option>
                <option value="America/Chicago">America/Chicago (US Central)</option>
                <option value="America/Denver">America/Denver (US Mountain)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (US Pacific)</option>
                <option value="America/Sao_Paulo">America/Sao_Paulo (Brazil)</option>
              </optgroup>
              <optgroup label="Africa">
                <option value="Africa/Cairo">Africa/Cairo (Egypt)</option>
                <option value="Africa/Nairobi">Africa/Nairobi (Kenya)</option>
                <option value="Africa/Lagos">Africa/Lagos (Nigeria)</option>
              </optgroup>
            </select>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <button
            onClick={onClose}
            className="border border-slate-300 text-slate-700 rounded-lg h-10 px-4 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !fullName.trim()}
            className="bg-[#4848e5] hover:bg-[#4848e5]/90 text-white rounded-lg h-10 px-4 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
