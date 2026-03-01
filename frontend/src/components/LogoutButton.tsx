'use client';

import { useRouter } from 'next/navigation';
import { clearSession } from '@/lib/api/auth';

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className = '' }: LogoutButtonProps) {
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.push('/login');
  }

  return (
    <button
      onClick={handleLogout}
      className={`text-sm text-gray-500 hover:text-gray-900 transition-colors ${className}`}
    >
      Log out
    </button>
  );
}
