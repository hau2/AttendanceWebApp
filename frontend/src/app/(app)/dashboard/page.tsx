'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.full_name}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        {clock && (
          <p className="text-gray-900 text-3xl font-mono font-semibold mt-1 tabular-nums">{clock}</p>
        )}
      </div>

      {isAttendanceParticipant ? (
        <>
          <CheckInOutCard />
          <div className="mt-4 text-center">
            <Link
              href="/attendance/history"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
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
  );
}
