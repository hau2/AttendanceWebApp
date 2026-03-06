'use client';

import { useState } from 'react';
import { CreateUserData, importUsersCSV } from '@/lib/api/users';
import { getStoredToken } from '@/lib/api/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Import Users from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Need a template?</span>
            <a
              href={CSV_TEMPLATE_URI}
              download="users-template.csv"
              className="text-sm text-[#4848e5] hover:underline"
            >
              Download template
            </a>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Select CSV file
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#4848e5]/10 file:text-[#4848e5] hover:file:bg-[#4848e5]/20"
            />
          </div>

          {parseError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {parseError}
            </div>
          )}

          {parsedRows.length > 0 && !result && (
            <div className="p-3 bg-[#4848e5]/10 border border-[#4848e5]/20 rounded-lg text-sm text-[#4848e5]">
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

          <DialogFooter className="pt-2">
            <button
              onClick={handleClose}
              className="border border-slate-300 text-slate-700 rounded-lg h-10 px-4 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              {result ? 'Close' : 'Cancel'}
            </button>
            {!result && (
              <button
                onClick={handleImport}
                disabled={parsedRows.length === 0 || loading}
                className="bg-[#4848e5] hover:bg-[#4848e5]/90 text-white rounded-lg h-10 px-4 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Importing...' : `Import ${parsedRows.length > 0 ? `(${parsedRows.length})` : ''}`}
              </button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
