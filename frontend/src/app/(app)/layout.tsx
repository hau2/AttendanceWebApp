'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession, getStoredUser, type AuthUser } from '@/lib/api/auth';
import {
  LayoutDashboard,
  Clock,
  Users,
  CalendarClock,
  Building2,
  Settings,
  ClipboardList,
  BarChart3,
  TrendingUp,
  LogOut,
  UserCheck,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['employee', 'manager', 'admin', 'owner'] },
  { href: '/attendance/history', label: 'My Attendance', icon: Clock, roles: ['employee', 'manager', 'admin', 'owner'] },
  { href: '/admin/attendance', label: 'Records', icon: ClipboardList, roles: ['admin', 'owner', 'manager'] },
  { href: '/admin/users', label: 'Users', icon: Users, roles: ['admin', 'owner'] },
  { href: '/admin/shifts', label: 'Shifts', icon: CalendarClock, roles: ['admin', 'owner'] },
  { href: '/admin/divisions', label: 'Divisions', icon: Building2, roles: ['admin', 'owner'] },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'owner', 'manager'] },
  { href: '/executive', label: 'Executive', icon: TrendingUp, roles: ['executive', 'admin', 'owner'] },
  { href: '/admin/settings', label: 'Settings', icon: Settings, roles: ['admin', 'owner'] },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = getStoredUser();
    if (u) setUser(u);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const userRole = user?.role || '';
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  function handleLogout() {
    clearSession();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-[#4848e5]/10 flex items-center justify-center text-[#4848e5]">
              <UserCheck className="size-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 hidden sm:block">Attendance SaaS</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#4848e5]/10 text-[#4848e5]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: profile + mobile menu */}
          <div className="flex items-center gap-3">
            {/* Profile dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors"
              >
                <div className="size-8 rounded-full bg-[#4848e5] flex items-center justify-center text-xs font-bold text-white">
                  {user ? getInitials(user.full_name) : '?'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                  {user?.full_name || ''}
                </span>
                <ChevronDown className="size-4 text-slate-400 hidden sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#4848e5]/10 text-[#4848e5] capitalize">
                      {userRole}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="size-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden flex items-center justify-center size-10 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3">
            <nav className="flex flex-col gap-1">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#4848e5]/10 text-[#4848e5]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>
      <main className="max-w-[1400px] mx-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
