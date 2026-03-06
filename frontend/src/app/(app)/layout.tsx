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
  PanelLeftClose,
  PanelLeft,
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
  const [collapsed, setCollapsed] = useState(false);
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

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const userRole = user?.role || '';
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  function handleLogout() {
    clearSession();
    router.push('/login');
  }

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[260px]';
  const mainMargin = collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]';

  return (
    <>
      {/* Mobile top bar — outside flex to avoid stacking issues */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-50 bg-white border-b border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-[#4848e5] flex items-center justify-center text-white shadow-sm shadow-[#4848e5]/20">
              <UserCheck className="size-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              Attendance<span className="text-[#4848e5]">SaaS</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="flex items-center justify-center size-10 rounded-xl hover:bg-slate-100 text-slate-600 active:bg-slate-200 transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between h-14 px-4 border-b border-slate-100 shrink-0">
              <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setMobileNavOpen(false)}>
                <div className="size-8 rounded-lg bg-[#4848e5] flex items-center justify-center text-white">
                  <UserCheck className="size-4" />
                </div>
                <span className="text-base font-bold tracking-tight text-slate-900">
                  Attendance<span className="text-[#4848e5]">SaaS</span>
                </span>
              </Link>
              <button onClick={() => setMobileNavOpen(false)} className="size-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
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
                    <Icon className="size-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="shrink-0 border-t border-slate-100 p-3">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="size-8 rounded-full bg-gradient-to-br from-[#4848e5] to-[#6c6cf0] flex items-center justify-center text-xs font-bold text-white">
                  {user ? getInitials(user.full_name) : '?'}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold text-slate-800 truncate">{user?.full_name || ''}</span>
                  <span className="text-xs text-slate-400 capitalize">{userRole}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 mt-1 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-xl"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop + main content wrapper */}
      <div className="min-h-screen bg-[#f6f6f8] flex">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 ${sidebarWidth} bg-white border-r border-slate-200/80 shadow-[1px_0_3px_rgba(0,0,0,0.04)] transition-all duration-200`}
        >
          {/* Brand */}
          <div className="flex items-center gap-3 h-16 px-4 border-b border-slate-100 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-3 group min-w-0">
              <div className="size-9 rounded-xl bg-[#4848e5] flex items-center justify-center text-white shadow-sm shadow-[#4848e5]/20 group-hover:shadow-md group-hover:shadow-[#4848e5]/30 transition-shadow shrink-0">
                <UserCheck className="size-5" />
              </div>
              {!collapsed && (
                <span className="text-lg font-bold tracking-tight text-slate-900 truncate">
                  Attendance<span className="text-[#4848e5]">SaaS</span>
                </span>
              )}
            </Link>
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'text-[#4848e5] bg-[#4848e5]/8'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`size-[18px] shrink-0 ${active ? 'text-[#4848e5]' : ''}`} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Bottom: collapse toggle + profile */}
          <div className="shrink-0 border-t border-slate-100">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors text-sm"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeft className="size-[18px] mx-auto" /> : (
                <>
                  <PanelLeftClose className="size-[18px]" />
                  <span>Collapse</span>
                </>
              )}
            </button>

            <div ref={profileRef} className="relative px-3 pb-4 pt-2">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className={`flex items-center gap-3 w-full rounded-xl px-2.5 py-2.5 transition-colors ${
                  profileOpen ? 'bg-slate-100' : 'hover:bg-slate-50'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <div className="size-8 rounded-full bg-gradient-to-br from-[#4848e5] to-[#6c6cf0] flex items-center justify-center text-xs font-bold text-white ring-2 ring-white shrink-0">
                  {user ? getInitials(user.full_name) : '?'}
                </div>
                {!collapsed && (
                  <>
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="text-sm font-semibold text-slate-800 truncate w-full text-left leading-tight">
                        {user?.full_name || ''}
                      </span>
                      <span className="text-xs text-slate-400 capitalize leading-tight">{userRole}</span>
                    </div>
                    <ChevronDown className={`size-3.5 text-slate-400 shrink-0 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>

              {profileOpen && (
                <div className={`absolute bottom-full mb-2 ${collapsed ? 'left-full ml-2' : 'left-3 right-3'} bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200/80 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 ${collapsed ? 'w-56' : ''}`}>
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
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className={`flex-1 transition-all duration-200 ${mainMargin} pt-14 lg:pt-0`}>
          <div className="max-w-[1400px] mx-auto p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
