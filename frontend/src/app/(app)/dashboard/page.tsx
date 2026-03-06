'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { getStoredUser, AuthUser } from '@/lib/api/auth';
import { CheckInOutCard } from './components/CheckInOutCard';

function getClockString(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [clock, setClock] = useState('');

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    setClock(getClockString());
    const id = setInterval(() => {
      setClock(getClockString());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (!user) return null;

  // Admins, executives, and owners see a different dashboard (Phase 5)
  const isAttendanceParticipant = ['employee', 'manager'].includes(user.role);

  return (
    <div className="flex flex-1 justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col w-full max-w-2xl gap-8">
        {/* Welcome Header */}
        <div className="flex flex-col gap-2 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">
            Welcome, {user.full_name}
          </h1>
          <p className="text-slate-500 text-lg font-medium">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          {clock && (
            <p className="text-slate-900 text-3xl font-mono font-semibold mt-1 tabular-nums">{clock}</p>
          )}
        </div>

        {isAttendanceParticipant ? (
          <>
            <CheckInOutCard />
            {/* Footer Links */}
            <div className="flex justify-center mt-4">
              <Link
                href="/attendance/history"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-[#4848e5] transition-colors font-medium"
              >
                <Clock className="w-4 h-4" />
                View History
              </Link>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-500">Attendance tracking dashboard coming in Phase 5.</p>
            <p className="text-gray-400 text-sm mt-2">Your role: {user.role}</p>
          </div>
        )}
      </div>
    </div>
  );
}
