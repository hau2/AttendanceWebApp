const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Shift {
  id: string;
  company_id: string;
  name: string;
  start_time: string;
  end_time: string;
  grace_period_minutes: number;
  created_at: string;
}

export interface CreateShiftData {
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
}

export async function listShifts(token: string): Promise<Shift[]> {
  const res = await fetch(`${API_URL}/shifts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Failed to list shifts');
  }
  return res.json() as Promise<Shift[]>;
}

export async function createShift(token: string, data: CreateShiftData): Promise<Shift> {
  const res = await fetch(`${API_URL}/shifts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Failed to create shift');
  }
  return res.json() as Promise<Shift>;
}

export async function updateShift(
  token: string,
  shiftId: string,
  data: Partial<CreateShiftData>,
): Promise<Shift> {
  const res = await fetch(`${API_URL}/shifts/${shiftId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Failed to update shift');
  }
  return res.json() as Promise<Shift>;
}
