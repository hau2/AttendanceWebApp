'use client';

import { useEffect, useState } from 'react';
import { AttendanceRecordWithUser, acknowledgeRecord, acknowledgeRemote } from '@/lib/api/attendance';
import { AdjustAttendanceModal } from './AdjustAttendanceModal';

interface Props {
  record: AttendanceRecordWithUser | null;
  onClose: () => void;
  onAdjusted?: (updated: AttendanceRecordWithUser) => void;
  userRole?: string;
}

function formatTime(isoStr: string | null): string {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function statusBadge(status: string | null) {
  const map: Record<string, string> = {
    'on-time': 'bg-green-100 text-green-800',
    'within-grace': 'bg-yellow-100 text-yellow-800',
    'late': 'bg-red-100 text-red-800',
    'early': 'bg-orange-100 text-orange-800',
  };
  if (!status) return null;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

export function AttendanceRecordDetail({ record, onClose, onAdjusted, userRole }: Props) {
  if (!record) return null;

  const [showAdjust, setShowAdjust] = useState(false);
  const [ackLoading, setAckLoading] = useState(false);
  const [remoteAckLoading, setRemoteAckLoading] = useState(false);
  const [localRecord, setLocalRecord] = useState(record);

  useEffect(() => { setLocalRecord(record); }, [record]);

  const canAdjust = ['admin', 'owner'].includes(userRole ?? '');
  const canAcknowledge = ['manager', 'admin', 'owner'].includes(userRole ?? '');

  const employeeName = record.users?.full_name || 'Unknown Employee';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{employeeName}</h2>
            <p className="text-sm text-gray-500">{formatDate(record.work_date)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6">
          {/* Missing checkout alert */}
          {record.missing_checkout && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
              Missing checkout — auto-marked by system
            </div>
          )}

          {/* Check-in section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Check-in</h3>
            {localRecord?.is_remote && (
              <span className="inline-block mb-2 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Remote Work</span>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700 font-medium">{formatTime(record.check_in_at)}</span>
                {statusBadge(record.check_in_status)}
                {record.minutes_late > 0 && (
                  <span className="text-xs text-red-600">+{record.minutes_late} min late</span>
                )}
              </div>
              {record.late_reason && (
                <p className="text-sm text-gray-600"><span className="font-medium">Reason:</span> {record.late_reason}</p>
              )}
              {canAcknowledge && (localRecord?.check_in_status === 'late' || localRecord?.check_out_status === 'early') && (
                <div className="mt-3">
                  {localRecord?.acknowledged_at ? (
                    <p className="text-xs text-green-600 font-medium">
                      Acknowledged {new Date(localRecord.acknowledged_at).toLocaleString()}
                    </p>
                  ) : (
                    <button
                      onClick={async () => {
                        if (!localRecord) return;
                        setAckLoading(true);
                        try {
                          const updated = await acknowledgeRecord(localRecord.id);
                          setLocalRecord(updated as typeof localRecord);
                        } catch { /* silently ignore */ }
                        finally { setAckLoading(false); }
                      }}
                      disabled={ackLoading}
                      className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                    >
                      {ackLoading ? 'Acknowledging...' : 'Acknowledge Late/Early'}
                    </button>
                  )}
                </div>
              )}
              {canAcknowledge && localRecord?.is_remote && (
                <div className="mt-2">
                  {localRecord?.remote_acknowledged_at ? (
                    <p className="text-xs text-green-600 font-medium">
                      Remote acknowledged {new Date(localRecord.remote_acknowledged_at).toLocaleString()}
                    </p>
                  ) : (
                    <button
                      onClick={async () => {
                        if (!localRecord) return;
                        setRemoteAckLoading(true);
                        try {
                          const updated = await acknowledgeRemote(localRecord.id);
                          setLocalRecord(updated as typeof localRecord);
                        } catch { /* silently ignore */ }
                        finally { setRemoteAckLoading(false); }
                      }}
                      disabled={remoteAckLoading}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {remoteAckLoading ? 'Acknowledging...' : 'Acknowledge Remote'}
                    </button>
                  )}
                </div>
              )}
              <div className="mt-3">
                {record.check_in_photo_url ? (
                  <img
                    src={record.check_in_photo_url}
                    alt="Check-in photo"
                    className="w-full max-w-xs h-48 object-cover rounded-lg"
                  />
                ) : (
                  <p className="text-sm text-gray-400 italic">No photo captured</p>
                )}
              </div>
            </div>
          </div>

          {/* Check-out section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Check-out</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700 font-medium">{formatTime(record.check_out_at)}</span>
                {statusBadge(record.check_out_status)}
                {record.minutes_early > 0 && (
                  <span className="text-xs text-orange-600">-{record.minutes_early} min early</span>
                )}
              </div>
              {record.early_note && (
                <p className="text-sm text-gray-600"><span className="font-medium">Note:</span> {record.early_note}</p>
              )}
              <div className="mt-3">
                {record.check_out_photo_url ? (
                  <img
                    src={record.check_out_photo_url}
                    alt="Check-out photo"
                    className="w-full max-w-xs h-48 object-cover rounded-lg"
                  />
                ) : (
                  <p className="text-sm text-gray-400 italic">No photo captured</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div>
            {canAdjust && (
              <button
                onClick={() => setShowAdjust(true)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Adjust
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {showAdjust && (
        <AdjustAttendanceModal
          record={record}
          onClose={() => setShowAdjust(false)}
          onSaved={(updated) => {
            setShowAdjust(false);
            onAdjusted?.(updated);
          }}
        />
      )}
    </div>
  );
}
