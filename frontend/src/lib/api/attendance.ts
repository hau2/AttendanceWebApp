const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AttendanceRecord {
  id: string;
  company_id: string;
  user_id: string;
  work_date: string;
  check_in_at: string | null;
  check_in_photo_url: string | null;
  check_in_ip: string | null;
  check_in_status: 'on-time' | 'within-grace' | 'late' | 'absent' | 'absent_morning' | null;
  minutes_late: number;
  late_reason: string | null;
  check_in_ip_within_allowlist: boolean | null;
  check_out_at: string | null;
  check_out_photo_url: string | null;
  check_out_ip: string | null;
  check_out_status: 'on-time' | 'early' | 'absent_afternoon' | null;
  minutes_early: number;
  early_note: string | null;
  check_out_ip_within_allowlist: boolean | null;
  missing_checkout: boolean;
  source: 'employee' | 'system' | 'admin';
  created_at: string;
  updated_at: string;
  // Phase 8 additions
  is_remote: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  remote_acknowledged_at: string | null;
  remote_acknowledged_by: string | null;
}

export interface PhotoUploadUrlResponse {
  signedUrl: string;
  permanentUrl: string;
  path: string;
  expiresIn: number;
}

function getToken(): string {
  return localStorage.getItem('access_token') || '';
}

export async function getPhotoUploadUrl(): Promise<PhotoUploadUrlResponse> {
  const res = await fetch(`${API_URL}/attendance/photo-upload-url`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to get photo upload URL');
  }
  return res.json();
}

export async function uploadPhotoBlob(signedUrl: string, blob: Blob): Promise<void> {
  const res = await fetch(signedUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': 'image/jpeg' },
  });
  if (!res.ok) {
    throw new Error('Photo upload failed');
  }
}

export async function checkIn(data: {
  photo_url?: string;
  late_reason?: string;
  is_remote?: boolean;
}): Promise<AttendanceRecord> {
  const res = await fetch(`${API_URL}/attendance/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Check-in failed');
  }
  return res.json();
}

export async function checkOut(data: {
  photo_url?: string;
  early_note?: string;
}): Promise<AttendanceRecord> {
  const res = await fetch(`${API_URL}/attendance/check-out`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Check-out failed');
  }
  return res.json();
}

export async function getTodayRecord(): Promise<AttendanceRecord | null> {
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const res = await fetch(
    `${API_URL}/attendance/history?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`,
    { headers: { Authorization: `Bearer ${getToken()}` } },
  );
  if (!res.ok) return null;
  const records: AttendanceRecord[] = await res.json();
  return records.find((r) => r.work_date === today) ?? null;
}

export async function getHistory(year: number, month: number): Promise<AttendanceRecord[]> {
  const res = await fetch(`${API_URL}/attendance/history?year=${year}&month=${month}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export interface AttendanceRecordWithUser extends AttendanceRecord {
  users?: { full_name: string; email: string };
}

export async function listRecords(
  year: number,
  month: number,
  userId?: string,
  page = 1,
  limit = 20,
): Promise<PaginatedResult<AttendanceRecordWithUser>> {
  const params = new URLSearchParams({ year: String(year), month: String(month), page: String(page), limit: String(limit) });
  if (userId) params.set('userId', userId);
  const res = await fetch(`${API_URL}/attendance/records?${params}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) return { data: [], total: 0, page, limit };
  return res.json();
}

export interface AdjustmentPayload {
  check_in_at?: string;   // ISO 8601 timestamp, e.g. "2026-03-01T08:45:00.000Z"
  check_out_at?: string;  // ISO 8601 timestamp
  reason: string;
}

export async function adjustRecord(
  recordId: string,
  data: AdjustmentPayload,
): Promise<AttendanceRecord> {
  const res = await fetch(`${API_URL}/attendance/records/${recordId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to adjust record');
  }
  return res.json();
}

export interface TeamSummary {
  total: number;
  late: number;
  punctualityRate: number;
  monthlyBreakdown: Array<{ date: string; present: number; late: number }>;
}

export async function getTeamSummary(year: number, month: number): Promise<TeamSummary> {
  const res = await fetch(
    `${API_URL}/attendance/reports/team-summary?year=${year}&month=${month}`,
    { headers: { Authorization: `Bearer ${getToken()}` } },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch team summary');
  }
  return res.json();
}

export interface ExecutiveSummary {
  attendanceRate: number;
  totalRecords: number;
  lateCount: number;
  lateRanking: Array<{ userId: string; fullName: string; lateCount: number; totalDays: number }>;
  monthlyBreakdown: Array<{ date: string; present: number; late: number; missingCheckout: number }>;
}

export async function getExecutiveSummary(year: number, month: number): Promise<ExecutiveSummary> {
  const res = await fetch(
    `${API_URL}/attendance/reports/executive?year=${year}&month=${month}`,
    { headers: { Authorization: `Bearer ${getToken()}` } },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch executive summary');
  }
  return res.json();
}

export interface MonthlyReportStats {
  total: number;
  lateCount: number;
  onTimeCount: number;
  withinGraceCount: number;
  missingCheckoutCount: number;
  lateRate: number;
}

export interface MonthlyReport {
  records: AttendanceRecordWithUser[];
  stats: MonthlyReportStats;
  total: number;
  page: number;
  limit: number;
}

export async function getMonthlyReport(
  year: number,
  month: number,
  page = 1,
  limit = 20,
): Promise<MonthlyReport> {
  const res = await fetch(
    `${API_URL}/attendance/reports/monthly?year=${year}&month=${month}&page=${page}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${getToken()}` } },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch monthly report');
  }
  return res.json();
}

export async function downloadAttendanceCsv(year: number, month: number): Promise<void> {
  const res = await fetch(
    `${API_URL}/attendance/export/csv?year=${year}&month=${month}`,
    { headers: { Authorization: `Bearer ${getToken()}` } },
  );
  if (!res.ok) throw new Error('Failed to export CSV');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance-${year}-${String(month).padStart(2, '0')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function acknowledgeRecord(recordId: string): Promise<AttendanceRecord> {
  const res = await fetch(`${API_URL}/attendance/records/${recordId}/acknowledge`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to acknowledge record');
  }
  return res.json();
}

export async function acknowledgeRemote(recordId: string): Promise<AttendanceRecord> {
  const res = await fetch(`${API_URL}/attendance/records/${recordId}/acknowledge-remote`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to acknowledge remote record');
  }
  return res.json();
}

export interface RefreshResult {
  absentMorningCount: number;
  absentCount: number;
  absentAfternoonCount: number;
  lastRefreshAt: string;
}

export async function triggerRefresh(): Promise<RefreshResult> {
  const res = await fetch(`${API_URL}/attendance/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, unknown>).message as string || 'Data Refresh failed');
  }
  return res.json();
}
