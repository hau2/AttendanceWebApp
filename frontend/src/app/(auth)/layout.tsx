import { UserCheck } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f6f6f8] min-h-screen flex items-center justify-center p-4">
      <div className="flex flex-col max-w-[480px] w-full justify-center py-10">
        <div className="flex flex-col items-center text-center gap-3 p-4 mb-6">
          <div className="h-12 w-12 rounded-xl bg-[#4848e5] flex items-center justify-center mb-2 shadow-lg shadow-[#4848e5]/30 text-white">
            <UserCheck className="h-6 w-6" />
          </div>
          <h1 className="text-slate-900 tracking-tight text-[32px] font-bold leading-tight">
            Attendance SaaS
          </h1>
          <p className="text-slate-500 text-base font-normal leading-normal">
            Attendance tracking for your team
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
