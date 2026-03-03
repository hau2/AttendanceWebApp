'use client';
import { useEffect, useRef, useState } from 'react';
import {
  AttendanceRecord,
  checkIn,
  checkOut,
  getPhotoUploadUrl,
  getTodayRecord,
  uploadPhotoBlob,
} from '@/lib/api/attendance';

type FlowState = 'idle' | 'camera-open' | 'photo-preview' | 'submitting' | 'error';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    getTodayRecord()
      .then((rec) => setTodayRecord(rec))
      .catch(() => setTodayRecord(null));
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
    setIsRemote(false);
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
      <div className="bg-white rounded-xl shadow-md p-8 max-w-sm mx-auto text-center">
        <p className="text-gray-400 text-sm">Loading...</p>
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
      <div className="bg-white rounded-xl shadow-md p-8 max-w-sm mx-auto text-center">
        <div className="text-green-600 text-4xl mb-3">&#10003;</div>
        <p className="text-lg font-semibold text-gray-800">All done for today</p>
        {todayRecord.is_remote && (
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Remote</span>
        )}
        {inTime && <p className="text-sm text-gray-500 mt-1">Checked in at {inTime}</p>}
        <p className="text-sm text-gray-500">Checked out at {outTime}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-8 max-w-sm mx-auto text-center">
      {/* Idle state */}
      {flowState === 'idle' && (
        <>
          {todayRecord?.check_in_at && (
            <p className="text-sm text-gray-500 mb-4">
              Checked in at{' '}
              {new Date(todayRecord.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          {action === 'check-in' && (
            <label className="flex items-center gap-2 mb-4 cursor-pointer justify-center">
              <input
                type="checkbox"
                checked={isRemote}
                onChange={(e) => setIsRemote(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 font-medium">Working remotely today</span>
            </label>
          )}
          <button
            onClick={openCamera}
            className={
              action === 'check-in'
                ? 'w-full py-4 px-6 bg-green-600 text-white text-xl font-bold rounded-xl hover:bg-green-700 transition-colors'
                : 'w-full py-4 px-6 bg-red-600 text-white text-xl font-bold rounded-xl hover:bg-red-700 transition-colors'
            }
          >
            {action === 'check-in' ? 'CHECK IN' : 'CHECK OUT'}
          </button>
        </>
      )}

      {/* Camera open */}
      {flowState === 'camera-open' && (
        <>
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-3">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          </div>
          <button
            onClick={capturePhoto}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg mt-1"
          >
            Capture Photo
          </button>
          <button
            onClick={() => { stopStream(); setFlowState('idle'); }}
            className="w-full py-2 mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </>
      )}

      {/* Photo preview */}
      {flowState === 'photo-preview' && capturedUrl && (
        <>
          <img
            src={capturedUrl}
            alt="Captured"
            className="w-full rounded-lg mb-3 object-cover"
          />
          {needsLateReason && (
            <div className="mb-3 text-left">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for being late <span className="text-red-500">*</span>
              </label>
              <textarea
                value={lateReason}
                onChange={(e) => setLateReason(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please provide a reason..."
              />
            </div>
          )}
          {needsEarlyNote && (
            <div className="mb-3 text-left">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note for early check-out <span className="text-red-500">*</span>
              </label>
              <textarea
                value={earlyNote}
                onChange={(e) => setEarlyNote(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>
          <button
            onClick={() => { setCapturedBlob(null); setCapturedUrl(null); setFlowState('idle'); setNeedsLateReason(false); setNeedsEarlyNote(false); }}
            className="w-full py-2 mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Retake
          </button>
        </>
      )}

      {/* Submitting */}
      {flowState === 'submitting' && (
        <div className="py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-500 text-sm mt-3">Submitting...</p>
        </div>
      )}

      {/* Error (non-retryable) */}
      {flowState === 'error' && (
        <>
          <p className="text-red-600 text-sm mt-2 mb-4">{error}</p>
          <button
            onClick={() => setFlowState('idle')}
            className="w-full py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg"
          >
            Back
          </button>
        </>
      )}
    </div>
  );
}
