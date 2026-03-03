'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';
import { getStoredUser } from '@/lib/api/auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const user = getStoredUser();
    if (user) setUserRole(user.role);
  }, []);

  const navLinkClass = (href: string) =>
    `text-sm font-medium px-3 py-1 rounded transition-colors ${
      pathname === href || pathname.startsWith(href + '/')
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-gray-900">Attendance SaaS</span>
          <nav className="flex items-center gap-1">
            {['employee', 'manager', 'admin', 'owner'].includes(userRole) && (
              <Link href="/dashboard" className={navLinkClass('/dashboard')}>Dashboard</Link>
            )}
            {['employee', 'manager', 'admin', 'owner'].includes(userRole) && (
              <Link href="/attendance" className={navLinkClass('/attendance')}>Attendance</Link>
            )}
            {['admin', 'owner', 'manager'].includes(userRole) && (
              <Link href="/admin/users" className={navLinkClass('/admin/users')}>Users</Link>
            )}
            {['admin', 'owner'].includes(userRole) && (
              <Link href="/admin/shifts" className={navLinkClass('/admin/shifts')}>Shifts</Link>
            )}
            {['admin', 'owner'].includes(userRole) && (
              <Link href="/admin/divisions" className={navLinkClass('/admin/divisions')}>Divisions</Link>
            )}
            {['admin', 'owner', 'manager'].includes(userRole) && (
              <Link href="/admin/attendance" className={navLinkClass('/admin/attendance')}>Records</Link>
            )}
            {['executive', 'admin', 'owner'].includes(userRole) && (
              <Link href="/executive" className={navLinkClass('/executive')}>Executive</Link>
            )}
            {['admin', 'owner', 'manager'].includes(userRole) && (
              <Link href="/admin/reports" className={navLinkClass('/admin/reports')}>Reports</Link>
            )}
          </nav>
        </div>
        <LogoutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
