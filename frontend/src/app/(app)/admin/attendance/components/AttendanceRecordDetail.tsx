'use client';

import { useEffect, useState } from 'react';
import { AttendanceRecordWithUser, acknowledgeRecord, acknowledgeRemote } from '@/lib/api/attendance';
import { AdjustAttendanceModal } from './AdjustAttendanceModal';
import { StatusBadge, RemoteBadge } from '@/components/ui/status-badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface Props {
  record: AttendanceRecordWithUser | null;
  onClose: () => void;
  onAdjusted?: (updated: AttendanceRecordWithUser) => void;
  userRole?: string;
}

function formatTime(isoStr: string | null): string {
  if (!isoStr) return '\u2014';
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function AttendanceRecordDetail({ record, onClose, onAdjusted, userRole }: Props) {
  const [showAdjust, setShowAdjust] = useState(false);
  const [ackLoading, setAckLoading] = useState(false);
  const [remoteAckLoading, setRemoteAckLoading] = useState(false);
  const [localRecord, setLocalRecord] = useState(record);

  useEffect(() => { setLocalRecord(record); }, [record]);

  const canAdjust = ['admin', 'owner'].includes(userRole ?? '');
  const canAcknowledge = ['manager', 'admin', 'owner'].includes(userRole ?? '');

  const employeeName = record?.users?.full_name || 'Unknown Employee';

  return (
    <Dialog open={!!record} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0" showCloseButton>
        {record && (
          <>
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>{employeeName}</DialogTitle>
              <DialogDescription>{formatDate(record.work_date)}</DialogDescription>
            </DialogHeader>

            {/* Content */}
            <div className="px-6 py-5 space-y-6">
              {/* Missing checkout alert */}
              {record.missing_checkout && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                  Missing checkout -- auto-marked by system
                </div>
              )}

              {/* Check-in section */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Check-in</h3>
                {localRecord?.is_remote && (
                  <span className="inline-block mb-2"><RemoteBadge /></span>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-700 font-medium">{formatTime(record.check_in_at)}</span>
                    <StatusBadge status={record.check_in_status} />
                    {record.minutes_late > 0 && (
                      <span className="text-xs text-red-600">+{record.minutes_late} min late</span>
                    )}
                  </div>
                  {record.late_reason && (
                    <p className="text-sm text-slate-600"><span className="font-medium">Reason:</span> {record.late_reason}</p>
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
                          className="px-3 py-1.5 text-xs bg-[#4848e5] text-white rounded-lg hover:bg-[#4848e5]/90 transition-colors disabled:opacity-50"
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
                      <p className="text-sm text-slate-400 italic">No photo captured</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Check-out section */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Check-out</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-700 font-medium">{formatTime(record.check_out_at)}</span>
                    <StatusBadge status={record.check_out_status} />
                    {record.minutes_early > 0 && (
                      <span className="text-xs text-orange-600">-{record.minutes_early} min early</span>
                    )}
                  </div>
                  {record.early_note && (
                    <p className="text-sm text-slate-600"><span className="font-medium">Note:</span> {record.early_note}</p>
                  )}
                  <div className="mt-3">
                    {record.check_out_photo_url ? (
                      <img
                        src={record.check_out_photo_url}
                        alt="Check-out photo"
                        className="w-full max-w-xs h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <p className="text-sm text-slate-400 italic">No photo captured</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="px-6 py-4 border-t border-slate-200">
              {canAdjust && (
                <button
                  onClick={() => setShowAdjust(true)}
                  className="bg-[#4848e5] hover:bg-[#4848e5]/90 text-white rounded-lg h-10 px-4 text-sm font-semibold transition-colors"
                >
                  Adjust
                </button>
              )}
              <button
                onClick={onClose}
                className="border border-slate-300 text-slate-700 rounded-lg h-10 px-4 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </DialogFooter>

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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
