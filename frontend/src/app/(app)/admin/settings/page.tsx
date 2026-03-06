'use client';
import { useEffect, useState } from 'react';
import {
  IpAllowlistEntry,
  getCompanySettings,
  updateCompanySettings,
  addIpEntry,
  removeIpEntry,
} from '@/lib/api/company';
import { getStoredToken, getStoredUser } from '@/lib/api/auth';
import { Trash2, Plus } from 'lucide-react';

type IpMode = 'disabled' | 'log-only' | 'enforce-block';

export default function AdminSettingsPage() {
  const [ipMode, setIpMode] = useState<IpMode>('log-only');
  const [allowlist, setAllowlist] = useState<IpAllowlistEntry[]>([]);
  const [cidrInput, setCidrInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const user = getStoredUser();
  if (!user || !['admin', 'owner'].includes(user.role)) return null;

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    getCompanySettings(token).then((s) => {
      setIpMode(s.ip_mode as IpMode);
      setAllowlist(s.ip_allowlist ?? []);
    }).catch(() => setError('Failed to load settings'));
  }, []);

  async function saveMode() {
    setSaving(true);
    setError(null);
    try {
      await updateCompanySettings({ ipMode });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEntry() {
    setAddError(null);
    if (!cidrInput.trim()) { setAddError('CIDR is required'); return; }
    try {
      const res = await addIpEntry({ cidr: cidrInput.trim(), label: labelInput.trim() || undefined });
      setAllowlist(res.ip_allowlist);
      setCidrInput('');
      setLabelInput('');
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : 'Failed to add entry');
    }
  }

  async function handleRemoveEntry(index: number) {
    try {
      const res = await removeIpEntry(index);
      setAllowlist(res.ip_allowlist);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to remove entry');
    }
  }

  const modeOptions: { value: IpMode; label: string; desc: string }[] = [
    { value: 'disabled', label: 'Disabled', desc: 'No IP check -- all employees can check in from any network.' },
    { value: 'log-only', label: 'Log Only', desc: 'Record violations and show a warning, but do not block check-in.' },
    { value: 'enforce-block', label: 'Enforce Block', desc: 'Reject check-in/out from IPs not in the allowlist (remote workers bypass this).' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-slate-900 text-2xl font-bold leading-tight tracking-tight mb-6">Company Settings</h1>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* IP Restriction Mode */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">IP Restriction Mode</h2>
        <p className="text-sm text-slate-500 mb-4">Controls how the system handles check-ins from outside the allowlist.</p>
        <div className="space-y-3 mb-5">
          {modeOptions.map((opt) => (
            <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="ipMode"
                value={opt.value}
                checked={ipMode === opt.value}
                onChange={() => setIpMode(opt.value)}
                className="mt-0.5 h-4 w-4 text-[#4848e5] focus:ring-[#4848e5]/50"
              />
              <div>
                <span className="text-sm font-medium text-slate-800">{opt.label}</span>
                <p className="text-xs text-slate-500">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
        <button
          onClick={saveMode}
          disabled={saving}
          className="h-10 px-4 rounded-lg bg-[#4848e5] text-white text-sm font-semibold hover:bg-[#4848e5]/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Mode'}
        </button>
        {savedMsg && <span className="ml-3 text-sm text-emerald-600 font-medium">Saved</span>}
      </div>

      {/* IP Allowlist */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">IP Allowlist</h2>
        <p className="text-sm text-slate-500 mb-4">
          Add individual IPv4 addresses or CIDR ranges. When the list is empty, no IP check runs regardless of mode.
        </p>

        {allowlist.length === 0 ? (
          <p className="text-sm text-slate-400 italic mb-4">No entries -- allowlist is empty.</p>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-hidden mb-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">CIDR</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Label</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {allowlist.map((entry, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-800">{entry.cidr}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{entry.label || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemoveEntry(i)}
                        className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add entry form */}
        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Add Entry</h3>
          {addError && <p className="text-xs text-red-600 mb-2">{addError}</p>}
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="e.g. 192.168.1.0/24 or 10.0.0.1"
              value={cidrInput}
              onChange={(e) => setCidrInput(e.target.value)}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4848e5]/50 focus:border-[#4848e5]"
            />
            <input
              type="text"
              placeholder="Label (optional)"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              className="w-40 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4848e5]/50 focus:border-[#4848e5]"
            />
            <button
              onClick={handleAddEntry}
              className="h-10 px-4 rounded-lg bg-[#4848e5] text-white text-sm font-semibold hover:bg-[#4848e5]/90 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          <p className="text-xs text-slate-400">Supports IPv4 addresses (10.0.0.1) and CIDR ranges (192.168.1.0/24).</p>
        </div>
      </div>

    </div>
  );
}
