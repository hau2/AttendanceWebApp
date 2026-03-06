'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import { loginUser, saveSession } from '@/lib/api/auth';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await loginUser(form);
      saveSession(response);
      // Check if onboarding complete
      if (!response.company.onboarding_complete) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-slate-900 text-xl font-bold leading-tight">
          Sign in to your account
        </h2>
        <p className="text-slate-500 text-sm font-normal leading-normal">
          Please enter your credentials to continue.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label
            className="text-slate-900 text-sm font-medium leading-normal"
            htmlFor="email"
          >
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="flex w-full rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-[#4848e5]/50 border border-slate-300 bg-white focus:border-[#4848e5] h-12 placeholder:text-slate-400 pl-11 pr-4 text-base font-normal leading-normal transition-colors"
              placeholder="name@company.com"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label
              className="text-slate-900 text-sm font-medium leading-normal"
              htmlFor="password"
            >
              Password
            </label>
            <span className="text-[#4848e5] hover:text-[#4848e5]/80 text-sm font-medium transition-colors cursor-pointer">
              Forgot password?
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="flex w-full rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-[#4848e5]/50 border border-slate-300 bg-white focus:border-[#4848e5] h-12 placeholder:text-slate-400 pl-11 pr-4 text-base font-normal leading-normal transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-[#4848e5] hover:bg-[#4848e5]/90 text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors shadow-sm shadow-[#4848e5]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="truncate">
            {loading ? 'Signing in...' : 'Sign In'}
          </span>
        </button>
      </form>

      <div className="text-center mt-2">
        <p className="text-slate-500 text-sm">
          New company?{' '}
          <Link
            href="/register"
            className="text-[#4848e5] hover:text-[#4848e5]/80 font-medium transition-colors"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
