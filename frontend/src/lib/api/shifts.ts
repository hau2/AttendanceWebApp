const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ShiftAssignment {
  id: string;
  company_id: string;
  user_id: string;
  shift_id: string;
  effective_date: string;
  created_at: string;
  shifts: {
    name: string;
    start_time: string;
    end_time: string;
    grace_period_minutes: number;
  };
}

export interface AssignShiftData {
  userId: string;
  shiftId: string;
  effectiveDate: string;
}

export interface Shift {
  id: string;
  company_id: string;
  name: string;
  start_time: string;
  end_time: string;
  grace_period_minutes: number;
  morning_end_time: string | null;
  afternoon_start_time: string | null;
  created_at: string;
}

export interface CreateShiftData {
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  morningEndTime?: string | null;
  afternoonStartTime?: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export async function listShifts(token: string, page = 1, limit = 20): Promise<PaginatedResult<Shift>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(`${API_URL}/shifts?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Failed to list shifts');
  }
  return res.json() as Promise<PaginatedResult<Shift>>;
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

export async function assignShift(
  token: string,
  data: AssignShiftData,
): Promise<ShiftAssignment> {
  const res = await fetch(`${API_URL}/shifts/assign`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Failed to assign shift');
  }
  return res.json() as Promise<ShiftAssignment>;
}

export async function getUserShiftInfo(
  token: string,
  userId: string,
): Promise<{ activeShift: ShiftAssignment | null; history: ShiftAssignment[] }> {
  const res = await fetch(`${API_URL}/shifts/assignments/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Failed to get shift info');
  }
  return res.json() as Promise<{ activeShift: ShiftAssignment | null; history: ShiftAssignment[] }>;
}
