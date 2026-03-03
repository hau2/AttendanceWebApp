const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'employee' | 'executive';
  is_active: boolean;
  manager_id: string | null;
  division_id: string | null;
  timezone: string | null;
  created_at: string;
  // Nested join from backend (optional — only present when listUsers() includes join)
  divisions?: {
    id: string;
    name: string;
    manager_id: string | null;
    users?: { id: string; full_name: string } | null;
  } | null;
}

export interface CreateUserData {
  fullName: string;
  email: string;
  password: string;
  role: string;
  managerId?: string;
  divisionId?: string;
}

export interface UpdateUserData {
  fullName?: string;
  timezone?: string | null;  // IANA string to set, null to clear
  role?: string;
  managerId?: string;
  divisionId?: string;
}

export async function listUsers(token: string): Promise<User[]> {
  const res = await fetch(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch users');
  }
  return res.json();
}

export async function createUser(token: string, data: CreateUserData): Promise<User> {
  const res = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create user');
  }
  return res.json();
}

export async function updateUser(
  token: string,
  userId: string,
  data: UpdateUserData,
): Promise<User> {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update user');
  }
  return res.json();
}

export async function setUserStatus(
  token: string,
  userId: string,
  isActive: boolean,
): Promise<User> {
  const res = await fetch(`${API_URL}/users/${userId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update user status');
  }
  return res.json();
}

export async function deleteUser(token: string, userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete user');
  }
}

export async function importUsersCSV(
  token: string,
  rows: CreateUserData[],
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      await createUser(token, row);
      success++;
    } catch (err: unknown) {
      failed++;
      const message = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`${row.email}: ${message}`);
    }
  }

  return { success, failed, errors };
}
