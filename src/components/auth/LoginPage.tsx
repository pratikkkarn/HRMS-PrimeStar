import React, { useState } from 'react';
import { Eye, EyeOff, FileText, UserPlus, CreditCard } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { MicrosoftSsoModal } from './MicrosoftSsoModal';
import { UserRole, DEMO_USERS, UserProfile } from '../../types/roles';
import { PrimeStarLogo } from '../common/PrimeStarLogo';

interface LoginPageProps {
  onLoginSuccess: (userRole: UserRole, userProfile: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [microsoftModalOpen, setMicrosoftModalOpen] = useState(false);

  // All 7 roles defined in the specification
  const allRoles: UserRole[] = [
    'CEO',
    'HR Head',
    'HR Executive',
    'Finance Manager',
    'PO Admin',
    'Project Manager',
    'Employee',
  ];

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email ID is required';
    } else if (!email.includes('@') || !email.includes('.')) {
      newErrors.email = 'Please enter a valid email address (e.g. yourname@primestar.com)';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const matchedUser =
      DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) ||
      DEMO_USERS.find((u) => u.role === 'PO Admin') ||
      DEMO_USERS[0];

    onLoginSuccess(matchedUser.role, matchedUser);
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    const user = DEMO_USERS.find((u) => u.role === role) || DEMO_USERS[0];
    onLoginSuccess(role, user);
  };

  return (
    <div className="min-h-[100dvh] lg:h-screen lg:max-h-screen w-full bg-slate-950 flex flex-col lg:flex-row font-sans antialiased text-slate-900 select-none overflow-x-hidden overflow-y-auto lg:overflow-y-hidden">
      {/* LEFT PANEL — COMPANY BRANDING (50% DESKTOP VIEWPORT, OPTIMIZED FOR 1440x900) */}
      <div className="w-full lg:w-1/2 relative bg-[#070E20] text-white flex flex-col justify-between p-6 lg:px-10 lg:py-8 overflow-hidden min-h-[440px] lg:min-h-full shrink-0">
        {/* CINEMATIC BACKGROUND GLOW & GLASS MESH PATTERN */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1530] via-[#081025] to-[#040814] z-0"></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 -right-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-[#040814] via-transparent to-transparent z-0"></div>

        {/* ARCHITECTURAL BUILDING GRID OVERLAY */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none z-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.2) 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        ></div>

        {/* TOP BRAND LOCKUP */}
        <div className="relative z-10 flex items-center gap-3">
          <PrimeStarLogo variant="dark-bg" size="lg" />
        </div>

        {/* MIDDLE HERO HEADLINE & CARDS */}
        <div className="relative z-10 my-auto py-4 max-w-lg space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-[1.15]">
              People. Projects.
              <br />
              Progress.
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-md">
              One platform for purchase orders, people and performance.
            </p>
          </div>

          {/* 3 COMPACT FEATURE CARDS */}
          <div className="space-y-2.5 pt-1">
            {/* CARD 1: PO TRACKING */}
            <div className="p-3 bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-700/50 flex items-center gap-3 shadow-xs hover:border-slate-600/60 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">PO Tracking</h4>
                <p className="text-[11px] text-slate-300">Track value, expiry and utilization.</p>
              </div>
            </div>

            {/* CARD 2: EMPLOYEE ONBOARDING */}
            <div className="p-3 bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-700/50 flex items-center gap-3 shadow-xs hover:border-slate-600/60 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Employee Onboarding</h4>
                <p className="text-[11px] text-slate-300">Digitize and standardize hiring.</p>
              </div>
            </div>

            {/* CARD 3: EMPLOYEE PORTAL */}
            <div className="p-3 bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-700/50 flex items-center gap-3 shadow-xs hover:border-slate-600/60 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Employee Portal</h4>
                <p className="text-[11px] text-slate-300">
                  Self-service for payslips, timesheets and personal details.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM BRAND FOOTER (LEFT) */}
        <div className="relative z-10 text-[10px] text-slate-500 pt-2">
          Prime Star HRMS Enterprise Platform v2.4
        </div>
      </div>

      {/* RIGHT PANEL — LOGIN FORM (OPTIMIZED FOR 1440x900 VIEWPORT FIT) */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-between p-6 lg:px-10 lg:py-8 min-h-full overflow-y-auto">
        <div className="max-w-md w-full mx-auto my-auto space-y-4 py-2">
          {/* LOGO & HEADING */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <PrimeStarLogo size="md" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Sign in to your account</p>
            </div>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleSignInSubmit} className="space-y-3 text-xs">
            {/* EMAIL INPUT */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email ID</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                placeholder="yourname@primestar.com"
                className={`w-full px-3.5 py-2 text-xs bg-white border rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors text-slate-900 placeholder-slate-400 ${
                  errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'
                }`}
              />
              {errors.email && <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.email}</p>}
            </div>

            {/* PASSWORD INPUT WITH MASK TOGGLE */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  placeholder="••••••••••••"
                  className={`w-full px-3.5 py-2 pr-10 text-xs bg-white border rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors text-slate-900 placeholder-slate-400 ${
                    errors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.password}</p>
              )}
            </div>

            {/* REMEMBER ME & FORGOT PASSWORD */}
            <div className="flex items-center justify-between pt-0.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* SIGN IN BUTTON */}
            <button
              type="submit"
              className="w-full bg-[#1D4ED8] hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-xs shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 active:scale-[0.99]"
            >
              Sign in
            </button>

            {/* OR DIVIDER */}
            <div className="relative flex py-1.5 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                OR
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* CONTINUE WITH MICROSOFT BUTTON */}
            <button
              type="button"
              onClick={() => setMicrosoftModalOpen(true)}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-lg border border-slate-300 text-xs shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {/* MICROSOFT 4-COLOR LOGO */}
              <div className="w-3.5 h-3.5 grid grid-cols-2 gap-0.5 shrink-0">
                <div className="bg-[#F25022] rounded-[0.5px]"></div>
                <div className="bg-[#7FBA00] rounded-[0.5px]"></div>
                <div className="bg-[#00A4EF] rounded-[0.5px]"></div>
                <div className="bg-[#FFB900] rounded-[0.5px]"></div>
              </div>
              <span>Continue with Microsoft</span>
            </button>
          </form>

          {/* DEVELOPMENT-ONLY ROLE SELECTOR (ALL 7 ROLES IN RESPONSIVE GRID) */}
          <div className="pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Development Mode — Role Selector
                </span>
                <span className="text-[9px] text-slate-400 font-mono">Select Role to Test</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-1.5">
                {allRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleQuickDemoLogin(role)}
                    className="px-2 py-1.5 text-[11px] font-medium bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-700 rounded border border-slate-200 shadow-2xs transition-colors text-center truncate cursor-pointer"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COPYRIGHT FOOTER */}
        <div className="text-center text-[11px] text-slate-400 pt-2 shrink-0">
          © 2026 Prime Star Consulting Services Pvt. Ltd.
        </div>
      </div>

      {/* MODALS */}
      {forgotModalOpen && (
        <ForgotPasswordModal
          isOpen={forgotModalOpen}
          onClose={() => setForgotModalOpen(false)}
        />
      )}

      {microsoftModalOpen && (
        <MicrosoftSsoModal
          isOpen={microsoftModalOpen}
          onClose={() => setMicrosoftModalOpen(false)}
          onContinueDemoSSO={() => {
            const defaultUser = DEMO_USERS.find((u) => u.role === 'PO Admin') || DEMO_USERS[0];
            onLoginSuccess('PO Admin', defaultUser);
          }}
        />
      )}
    </div>
  );
};
