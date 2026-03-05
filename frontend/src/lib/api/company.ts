import { getStoredToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function authHeaders() {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export interface IpAllowlistEntry {
  cidr: string;
  label?: string;
}

export interface CompanySettings {
  id: string;
  name: string;
  timezone: string;
  ip_mode: 'disabled' | 'log-only' | 'enforce-block';
  ip_allowlist: IpAllowlistEntry[];
  onboarding_complete: boolean;
  last_refresh_at: string | null;
}

export async function getCompanySettings(token: string): Promise<CompanySettings> {
  const res = await fetch(`${API_URL}/company/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch company settings');
  return res.json();
}

export async function updateCompanySettings(data: {
  timezone?: string;
  ipMode?: 'disabled' | 'log-only' | 'enforce-block';
}) {
  const res = await fetch(`${API_URL}/company/settings`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Failed to save settings');
  }
  return res.json();
}

export async function addIpEntry(data: { cidr: string; label?: string }): Promise<{ ip_allowlist: IpAllowlistEntry[] }> {
  const res = await fetch(`${API_URL}/company/ip-allowlist`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Failed to add IP entry');
  }
  return res.json();
}

export async function removeIpEntry(index: number): Promise<{ ip_allowlist: IpAllowlistEntry[] }> {
  const res = await fetch(`${API_URL}/company/ip-allowlist/${index}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Failed to remove IP entry');
  }
  return res.json();
}

export async function completeOnboarding(data: {
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  gracePeriodMinutes: number;
  firstUserFullName: string;
  firstUserEmail: string;
  firstUserPassword: string;
}) {
  const res = await fetch(`${API_URL}/onboarding/complete`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Failed to complete onboarding');
  }
  return res.json();
}
