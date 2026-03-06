'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerCompany, saveSession } from '@/lib/api/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: '',
    fullName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await registerCompany(form);
      saveSession(response);
      router.push('/onboarding');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="w-full bg-white rounded-xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
          Create your company account
        </h2>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Company Name
            </label>
            <input
              type="text"
              required
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full rounded-lg border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#4848e5] focus:ring-[#4848e5] focus:ring-1 h-11 px-4 text-sm transition-colors"
              placeholder="Enter your company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full rounded-lg border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#4848e5] focus:ring-[#4848e5] focus:ring-1 h-11 px-4 text-sm transition-colors"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#4848e5] focus:ring-[#4848e5] focus:ring-1 h-11 px-4 text-sm transition-colors"
              placeholder="Enter your email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#4848e5] focus:ring-[#4848e5] focus:ring-1 h-11 px-4 text-sm transition-colors"
              placeholder="Create a password"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Must be at least 8 characters.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4848e5] hover:bg-[#4848e5]/90 text-white font-medium h-11 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>

      <p className="mt-6 text-sm text-slate-600 text-center">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-[#4848e5] hover:text-[#4848e5]/80 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
