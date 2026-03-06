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
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="size-9 rounded-xl bg-[#4848e5] flex items-center justify-center text-white shadow-sm shadow-[#4848e5]/20 group-hover:shadow-md group-hover:shadow-[#4848e5]/30 transition-shadow">
                <UserCheck className="size-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 hidden sm:block">
                Attendance<span className="text-[#4848e5]">SaaS</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-0.5">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      active
                        ? 'text-[#4848e5] bg-[#4848e5]/8'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`size-4 ${active ? 'text-[#4848e5]' : ''}`} />
                    <span>{item.label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#4848e5] rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side: profile + mobile toggle */}
            <div className="flex items-center gap-2">
              {/* Profile */}
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors ${
                    profileOpen ? 'bg-slate-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="size-8 rounded-full bg-gradient-to-br from-[#4848e5] to-[#6c6cf0] flex items-center justify-center text-xs font-bold text-white ring-2 ring-white">
                    {user ? getInitials(user.full_name) : '?'}
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-semibold text-slate-800 max-w-[120px] truncate leading-tight">
                      {user?.full_name || ''}
                    </span>
                    <span className="text-xs text-slate-400 capitalize leading-tight">{userRole}</span>
                  </div>
                  <ChevronDown className={`size-3.5 text-slate-400 hidden sm:block transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200/80 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900 truncate">{user?.full_name}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-[#4848e5]/10 text-[#4848e5] capitalize">
                        {userRole}
                      </span>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg mx-0"
                      >
                        <LogOut className="size-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="lg:hidden flex items-center justify-center size-10 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
              >
                {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileNavOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 shadow-lg">
            <nav className="flex flex-col gap-0.5">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#4848e5]/10 text-[#4848e5]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
      </nav>

      <main className="max-w-[1400px] mx-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
