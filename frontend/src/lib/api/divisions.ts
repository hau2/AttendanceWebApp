const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface DivisionManager {
  id: string;
  full_name: string;
}

export interface Division {
  id: string;
  company_id: string;
  name: string;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
  users: DivisionManager | null; // Supabase join alias for the manager
}

export interface CreateDivisionData {
  name: string;
  managerId?: string;
}

export interface UpdateDivisionData {
  name?: string;
  managerId?: string | null;
}

export async function listDivisions(token: string): Promise<Division[]> {
  const res = await fetch(`${API_URL}/divisions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch divisions');
  }
  return res.json();
}

export async function createDivision(
  token: string,
  data: CreateDivisionData,
): Promise<Division> {
  const res = await fetch(`${API_URL}/divisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create division');
  }
  return res.json();
}

export async function updateDivision(
  token: string,
  id: string,
  data: UpdateDivisionData,
): Promise<Division> {
  const res = await fetch(`${API_URL}/divisions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update division');
  }
  return res.json();
}

export async function deleteDivision(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/divisions/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete division');
  }
}
