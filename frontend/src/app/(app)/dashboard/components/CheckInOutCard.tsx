'use client';
import { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import {
  AttendanceRecord,
  checkIn,
  checkIpStatus,
  checkOut,
  getPhotoUploadUrl,
  getTodayRecord,
  IpCheckResult,
  uploadPhotoBlob,
} from '@/lib/api/attendance';

type FlowState = 'idle' | 'ip-checking' | 'ip-blocked' | 'ip-warning' | 'camera-open' | 'photo-preview' | 'submitting' | 'error';
type Action = 'check-in' | 'check-out';

export function CheckInOutCard() {
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null | undefined>(undefined);
  const [action, setAction] = useState<Action>('check-in');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsLateReason, setNeedsLateReason] = useState(false);
  const [needsEarlyNote, setNeedsEarlyNote] = useState(false);
  const [lateReason, setLateReason] = useState('');
  const [earlyNote, setEarlyNote] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [ipCheckResult, setIpCheckResult] = useState<IpCheckResult | null>(null);
  const [currentIp, setCurrentIp] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    getTodayRecord()
      .then((rec) => setTodayRecord(rec))
      .catch(() => setTodayRecord(null));
    checkIpStatus()
      .then((result) => setCurrentIp(result.ip))
      .catch(() => {/* ignore — IP display is informational */});
  }, []);

  useEffect(() => {
    if (todayRecord !== undefined) {
      if (todayRecord?.check_out_at) {
        // already checked out today
      } else if (todayRecord?.check_in_at) {
        setAction('check-out');
      } else {
        setAction('check-in');
      }
    }
  }, [todayRecord]);

  // Attach stream to video element after React renders the camera-open state
  useEffect(() => {
    if (flowState === 'camera-open' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {/* already playing */});
    }
  }, [flowState]);

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  async function openCamera() {
    setError(null);
    setNeedsLateReason(false);
    setNeedsEarlyNote(false);
    setLateReason('');
    setEarlyNote('');
    setCapturedBlob(null);
    setCapturedUrl(null);
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      setFlowState('camera-open'); // stream attached via useEffect after render
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Camera access denied');
      setFlowState('error');
    }
  }

  async function handleActionButton() {
    setError(null);
    setFlowState('ip-checking');
    try {
      const result = await checkIpStatus();
      setIpCheckResult(result);

      // No restriction when: disabled mode, allowlist is empty (withinAllowlist=true), or IP matches allowlist
      if (result.ipMode === 'disabled' || result.withinAllowlist) {
        // Proceed directly to camera
        await openCamera();
        return;
      }

      // IP is outside allowlist
      if (result.ipMode === 'enforce-block') {
        // Remote work bypass: if checkbox is already checked, allow through
        if (action === 'check-in' && isRemote) {
          await openCamera();
          return;
        }
        // Block
        setFlowState('ip-blocked');
        return;
      }

      if (result.ipMode === 'log-only') {
        // Show soft warning — let user decide
        setFlowState('ip-warning');
        return;
      }

      // Fallback: proceed
      await openCamera();
    } catch {
      // If IP check fails (e.g. network error), fall through to camera — don't block employee
      setFlowState('idle');
      await openCamera();
    }
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Camera is still loading — please wait a moment and try again');
      setFlowState('error');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    stopStream();
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Failed to capture photo');
          setFlowState('error');
          return;
        }
        setCapturedBlob(blob);
        setCapturedUrl(URL.createObjectURL(blob));
        setFlowState('photo-preview');
      },
      'image/jpeg',
      0.85,
    );
  }

  async function submitAction() {
    if (!capturedBlob) return;
    setFlowState('submitting');
    setError(null);
    try {
      const { signedUrl, permanentUrl } = await getPhotoUploadUrl();
      await uploadPhotoBlob(signedUrl, capturedBlob);

      let record: AttendanceRecord;
      if (action === 'check-in') {
        record = await checkIn({ photo_url: permanentUrl, late_reason: lateReason || undefined, is_remote: isRemote });
      } else {
        record = await checkOut({ photo_url: permanentUrl, early_note: earlyNote || undefined });
      }
      setTodayRecord(record);
      setFlowState('idle');
      setCapturedBlob(null);
      setCapturedUrl(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      if (action === 'check-in' && msg.toLowerCase().includes('requires a reason')) {
        setNeedsLateReason(true);
        setFlowState('photo-preview');
      } else if (action === 'check-out' && msg.toLowerCase().includes('requires a note')) {
        setNeedsEarlyNote(true);
        setFlowState('photo-preview');
      } else if (msg.includes('403') || msg.toLowerCase().includes('ip') || msg.toLowerCase().includes('blocked')) {
        setError('Check-in blocked: your IP address is not in the company allowlist');
        setFlowState('error');
      } else {
        setError(msg);
        setFlowState('photo-preview');
      }
    }
  }

  // Loading state while fetching today's record
  if (todayRecord === undefined) {
    return (
      <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 p-6 md:p-8 relative overflow-hidden">
        <p className="text-slate-400 text-sm text-center">Loading...</p>
      </div>
    );
  }

  // Already checked out today
  if (todayRecord?.check_out_at) {
    const inTime = todayRecord.check_in_at
      ? new Date(todayRecord.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : null;
    const outTime = new Date(todayRecord.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 p-6 md:p-8 relative overflow-hidden text-center">
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#10b981]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10">
          <div className="text-[#10b981] text-4xl mb-3">&#10003;</div>
          <p className="text-lg font-semibold text-slate-800">All done for today</p>
          {todayRecord.is_remote && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#4848e5]/10 text-[#4848e5]">Remote</span>
          )}
          {inTime && <p className="text-sm text-slate-500 mt-1">Checked in at {inTime}</p>}
          <p className="text-sm text-slate-500">Checked out at {outTime}</p>
          {currentIp && (
            <p className="text-xs text-slate-400 mt-2">
              Your IP: <span className="font-mono">{currentIp}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
      {/* Decorative Background Element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#10b981]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

      {/* Idle state */}
      {flowState === 'idle' && (
        <div className="flex flex-col gap-6 z-10">
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl font-bold">
              {action === 'check-in' ? 'Ready to Check In' : 'Ready to Check Out'}
            </h3>
            <p className="text-slate-500 text-base">
              {action === 'check-in'
                ? 'Please ensure you are at the correct location or select remote work.'
                : 'Take a photo to complete your check-out.'}
            </p>
            {todayRecord?.check_in_at && (
              <p className="text-sm text-slate-400">
                Checked in at{' '}
                {new Date(todayRecord.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            {currentIp && (
              <p className="text-xs text-slate-400 mt-1">
                Your IP: <span className="font-mono">{currentIp}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-6 mt-4">
            {/* Remote Checkbox */}
            {action === 'check-in' && (
              <label className="flex items-center gap-x-4 cursor-pointer p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={isRemote}
                  onChange={(e) => setIsRemote(e.target.checked)}
                  className="h-6 w-6 rounded border-gray-300 bg-white text-[#10b981] checked:bg-[#10b981] checked:border-[#10b981] focus:ring-[#10b981] focus:ring-offset-0 focus:outline-none transition-all"
                />
                <span className="text-base font-semibold">Working remotely today</span>
              </label>
            )}

            {/* Action Button */}
            <button
              onClick={handleActionButton}
              className={
                action === 'check-in'
                  ? 'w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-16 px-6 bg-[#10b981] hover:bg-[#059669] active:scale-[0.98] transition-all text-white text-lg font-bold tracking-wide shadow-lg shadow-[#10b981]/30'
                  : 'w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-16 px-6 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] transition-all text-white text-lg font-bold tracking-wide shadow-lg shadow-amber-500/30'
              }
            >
              <Camera className="w-5 h-5 mr-2" />
              <span>{action === 'check-in' ? 'CHECK IN' : 'CHECK OUT'}</span>
            </button>
          </div>
        </div>
      )}

      {/* IP checking spinner */}
      {flowState === 'ip-checking' && (
        <div className="py-8 text-center z-10">
          <p className="text-sm text-slate-500">Checking network access...</p>
        </div>
      )}

      {/* IP warning — log-only mode with IP outside allowlist */}
      {flowState === 'ip-warning' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-left z-10">
          <p className="text-sm font-semibold text-yellow-800 mb-1">Outside Office Network</p>
          <p className="text-sm text-yellow-700 mb-4">
            Your IP address ({ipCheckResult?.ip}) is not in the company allowlist. Your check-in will be
            flagged as an IP violation. You can continue or cancel.
          </p>
          <div className="flex gap-3">
            <button
              onClick={async () => { await openCamera(); }}
              className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700"
            >
              Continue anyway
            </button>
            <button
              onClick={() => setFlowState('idle')}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* IP blocked — enforce-block mode with IP outside allowlist and not remote */}
      {flowState === 'ip-blocked' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-left z-10">
          <p className="text-sm font-semibold text-red-800 mb-1">Check-in Blocked</p>
          <p className="text-sm text-red-700 mb-4">
            Your IP address ({ipCheckResult?.ip}) is not in the company allowlist and IP restriction is
            enforced. You cannot check in from this network.
          </p>
          <p className="text-xs text-gray-500 mb-3">Working remotely? Tick &quot;Working remotely today&quot; above and try again.</p>
          <button
            onClick={() => setFlowState('idle')}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      )}

      {/* Camera open */}
      {flowState === 'camera-open' && (
        <div className="z-10">
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-3">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          </div>
          <button
            onClick={capturePhoto}
            className="w-full flex items-center justify-center rounded-xl h-16 px-6 bg-[#4848e5] hover:bg-[#4848e5]/90 transition-all text-white text-lg font-bold"
          >
            Capture Photo
          </button>
          <button
            onClick={() => { stopStream(); setFlowState('idle'); }}
            className="w-full py-2 mt-2 text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Photo preview */}
      {flowState === 'photo-preview' && capturedUrl && (
        <div className="z-10">
          <img
            src={capturedUrl}
            alt="Captured"
            className="w-full rounded-lg mb-3 object-cover"
          />
          {needsLateReason && (
            <div className="mb-3 text-left">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason for being late <span className="text-red-500">*</span>
              </label>
              <textarea
                value={lateReason}
                onChange={(e) => setLateReason(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4848e5]"
                placeholder="Please provide a reason..."
              />
            </div>
          )}
          {needsEarlyNote && (
            <div className="mb-3 text-left">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Note for early check-out <span className="text-red-500">*</span>
              </label>
              <textarea
                value={earlyNote}
                onChange={(e) => setEarlyNote(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4848e5]"
                placeholder="Please provide a note..."
              />
            </div>
          )}
          {error && <p className="text-red-600 text-sm mt-2 mb-2">{error}</p>}
          <button
            onClick={submitAction}
            disabled={
              (needsLateReason && !lateReason.trim()) ||
              (needsEarlyNote && !earlyNote.trim())
            }
            className="w-full flex items-center justify-center rounded-xl h-16 px-6 bg-[#4848e5] hover:bg-[#4848e5]/90 transition-all text-white text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>
          <button
            onClick={() => { setCapturedBlob(null); setCapturedUrl(null); setFlowState('idle'); setNeedsLateReason(false); setNeedsEarlyNote(false); }}
            className="w-full py-2 mt-2 text-sm text-slate-500 hover:text-slate-700"
          >
            Retake
          </button>
        </div>
      )}

      {/* Submitting */}
      {flowState === 'submitting' && (
        <div className="py-8 z-10 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4848e5] mx-auto" />
          <p className="text-slate-500 text-sm mt-3">Submitting...</p>
        </div>
      )}

      {/* Error (non-retryable) */}
      {flowState === 'error' && (
        <div className="z-10">
          <p className="text-red-600 text-sm mt-2 mb-4">{error}</p>
          <button
            onClick={() => setFlowState('idle')}
            className="w-full py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
