import React, { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';

export const CandidateLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 flex flex-col font-sans antialiased">
      <header className="bg-white border-b border-slate-200 py-3.5 px-6 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              ★
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-sm block">
                PRIME STAR CONSULTING SERVICES
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
                Candidate Onboarding Portal
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure Candidate Verification Session</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 my-4">
        {children}
      </main>

      <footer className="py-4 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        © 2026 Prime Star Consulting Services. All candidate submissions are protected & processed in accordance with privacy laws.
      </footer>
    </div>
  );
};
