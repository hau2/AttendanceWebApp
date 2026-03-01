import { getStoredToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function authHeaders() {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function updateCompanySettings(data: {
  timezone?: string;
  ipMode?: 'log-only' | 'enforce-block';
  ipAllowlist?: string[];
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
