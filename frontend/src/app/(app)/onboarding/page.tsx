'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateCompanySettings, completeOnboarding } from '@/lib/api/company';

// Common timezone list for the picker
const TIMEZONES = [
  'Asia/Ho_Chi_Minh',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
];

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Timezone + IP mode
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [ipMode, setIpMode] = useState<'log-only' | 'enforce-block'>('log-only');

  // Step 2: First shift
  const [shiftName, setShiftName] = useState('Morning Shift');
  const [shiftStartTime, setShiftStartTime] = useState('08:00');
  const [shiftEndTime, setShiftEndTime] = useState('17:00');
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(15);

  // Step 3: First employee
  const [firstUserFullName, setFirstUserFullName] = useState('');
  const [firstUserEmail, setFirstUserEmail] = useState('');
  const [firstUserPassword, setFirstUserPassword] = useState('');

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await updateCompanySettings({ timezone, ipMode });
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    // Validate times
    if (shiftEndTime <= shiftStartTime) {
      setError('End time must be after start time');
      return;
    }
    setStep(3);
  }

  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await completeOnboarding({
        shiftName,
        shiftStartTime,
        shiftEndTime,
        gracePeriodMinutes,
        firstUserFullName,
        firstUserEmail,
        firstUserPassword,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  }

  const stepTitles: Record<Step, string> = {
    1: 'Step 1 of 3 — Company Settings',
    2: 'Step 2 of 3 — Create your first shift',
    3: 'Step 3 of 3 — Add your first employee',
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome! Let's set up your company.</h1>
        <p className="text-gray-500 mt-1 text-sm">{stepTitles[step]}</p>
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-[#4848e5] rounded-full transition-all"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* STEP 1: Timezone + IP mode */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Timezone <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Used for all late/early calculations. Must be set before attendance tracking begins.
              </p>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
                required
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IP Restriction Mode
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Controls behavior when employees check in from outside the IP allowlist.
              </p>
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="ipMode"
                    value="log-only"
                    checked={ipMode === 'log-only'}
                    onChange={() => setIpMode('log-only')}
                    className="mt-0.5"
                  />
                  <span className="text-sm">
                    <strong>Log-only</strong> — Record the IP but allow check-in (recommended for most companies)
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="ipMode"
                    value="enforce-block"
                    checked={ipMode === 'enforce-block'}
                    onChange={() => setIpMode('enforce-block')}
                    className="mt-0.5"
                  />
                  <span className="text-sm">
                    <strong>Enforce-block</strong> — Reject check-ins from outside the allowlist
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4848e5] text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-[#4848e5]/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        )}

        {/* STEP 2: First shift */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift Name</label>
              <input
                type="text"
                required
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
                placeholder="Morning Shift"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  required
                  value={shiftStartTime}
                  onChange={(e) => setShiftStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  required
                  value={shiftEndTime}
                  onChange={(e) => setShiftEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grace Period (minutes)
              </label>
              <p className="text-xs text-gray-400 mb-2">
                How many minutes after shift start before a check-in is classified as "late".
              </p>
              <input
                type="number"
                min={0}
                max={60}
                required
                value={gracePeriodMinutes}
                onChange={(e) => setGracePeriodMinutes(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#4848e5] text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-[#4848e5]/90 transition-colors"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: First employee */}
        {step === 3 && (
          <form onSubmit={handleStep3} className="space-y-5">
            <p className="text-sm text-gray-500">
              Add your first employee. You can add more users later from the admin panel.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={firstUserFullName}
                onChange={(e) => setFirstUserFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
                placeholder="Employee Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={firstUserEmail}
                onChange={(e) => setFirstUserEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
                placeholder="employee@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={firstUserPassword}
                onChange={(e) => setFirstUserPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#4848e5] focus:ring-1 focus:ring-[#4848e5]"
                placeholder="Min. 8 characters"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Completing setup...' : 'Finish Setup'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
