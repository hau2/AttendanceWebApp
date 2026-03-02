'use client';

import { useState } from 'react';
import { CreateUserData, importUsersCSV } from '@/lib/api/users';
import { getStoredToken } from '@/lib/api/auth';

interface CsvImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

const CSV_TEMPLATE_URI =
  'data:text/csv;charset=utf-8,full_name,email,password,role%0ANguyen Van A,employee1@company.com,password123,employee%0ANguyen Thi B,manager1@company.com,password123,manager';

interface ParsedRow {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export function CsvImportModal({ open, onClose, onImported }: CsvImportModalProps) {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  if (!open) return null;

  function handleClose() {
    setParsedRows([]);
    setParseError(null);
    setResult(null);
    onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setParseError(null);
    setResult(null);
    setParsedRows([]);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== 'string') {
        setParseError('Could not read file.');
        return;
      }

      const lines = text.split('\n').filter((line) => line.trim() !== '');
      if (lines.length < 2) {
        setParseError('CSV must have a header row and at least one data row.');
        return;
      }

      // Parse header to find column indices
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const idx = {
        fullName: headers.indexOf('full_name'),
        email: headers.indexOf('email'),
        password: headers.indexOf('password'),
        role: headers.indexOf('role'),
      };

      if (idx.fullName === -1 || idx.email === -1 || idx.password === -1 || idx.role === -1) {
        setParseError('CSV must have columns: full_name, email, password, role');
        return;
      }

      const rows: ParsedRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        const row: ParsedRow = {
          fullName: cols[idx.fullName] ?? '',
          email: cols[idx.email] ?? '',
          password: cols[idx.password] ?? '',
          role: cols[idx.role] ?? '',
        };
        if (row.fullName || row.email) {
          rows.push(row);
        }
      }

      if (rows.length === 0) {
        setParseError('No valid rows found in CSV.');
        return;
      }

      setParsedRows(rows);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    const token = getStoredToken();
    if (!token) {
      setParseError('Not authenticated.');
      return;
    }

    setLoading(true);
    try {
      const data: CreateUserData[] = parsedRows.map((r) => ({
        fullName: r.fullName,
        email: r.email,
        password: r.password,
        role: r.role,
      }));

      const summary = await importUsersCSV(token, data);
      setResult(summary);
      onImported();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Import failed';
      setParseError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Import Users from CSV</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Need a template?</span>
            <a
              href={CSV_TEMPLATE_URI}
              download="users-template.csv"
              className="text-sm text-blue-600 hover:underline"
            >
              Download template
            </a>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select CSV file
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {parseError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {parseError}
            </div>
          )}

          {parsedRows.length > 0 && !result && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              {parsedRows.length} row{parsedRows.length !== 1 ? 's' : ''} parsed and ready to import.
            </div>
          )}

          {result && (
            <div className="space-y-2">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                Import complete: {result.success} created, {result.failed} failed.
              </div>
              {result.errors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 space-y-1">
                  <p className="font-medium">Errors:</p>
                  {result.errors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {!result && (
              <button
                onClick={handleImport}
                disabled={parsedRows.length === 0 || loading}
                className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Importing...' : `Import ${parsedRows.length > 0 ? `(${parsedRows.length})` : ''}`}
              </button>
            )}
            <button
              onClick={handleClose}
              className="flex-1 border border-gray-300 text-sm text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {result ? 'Close' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
