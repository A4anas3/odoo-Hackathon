import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { authApi } from '../api/authApi';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/form/Input';
import { FormField } from '../../../components/form/FormField';
import { Card, CardContent } from '../../../components/ui/Card';
import { Lock, Mail, ShieldAlert, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { ROUTES } from '../../../config/routes';

// Accounts created directly in the Spring Boot backend database
const SEEDED_BACKEND_USERS = [
  {
    role: 'Admin',
    email: 'admin@company.com',
    password: 'Passw0rd123',
    name: 'Sarah Connor',
    desc: 'System Admin & User Management',
    badge: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    role: 'HR Manager',
    email: 'hrmanager@company.com',
    password: 'Passw0rd123',
    name: 'Michael Scott',
    desc: 'Employee & Leave Approvals',
    badge: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    role: 'HR Payroll Admin',
    email: 'payrolladmin@company.com',
    password: 'Passw0rd123',
    name: 'Nisha Rao',
    desc: 'Salary Rules & Approvals',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  {
    role: 'HR Payroll User',
    email: 'payrolluser@company.com',
    password: 'Passw0rd123',
    name: 'Aarav Mehta',
    desc: 'Payrun Computation',
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-200'
  },
  {
    role: 'Employee',
    email: 'employee@company.com',
    password: 'Passw0rd123',
    name: 'Dwight Schrute',
    desc: 'Personal Staff Portal',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useCurrentUser();

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  const performLogin = async (userEmail, userPassword) => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await authApi.login({ email: userEmail, password: userPassword });
      login(response);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
        err.message ||
        'Invalid credentials. Please verify your work email and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both work email and password.');
      return;
    }
    await performLogin(email, password);
  };

  const handleSelectPreconfiguredUser = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    performLogin(account.email, account.password);
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F6F9] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-2xl shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">HR Portal</h1>
          <p className="text-sm text-slate-600 font-medium">Welcome back</p>
          <p className="text-xs text-slate-500">Sign in to continue to your workspace.</p>
        </div>

        {/* Auth Card */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-xl overflow-hidden">
          <CardContent className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Work Email" required>
                <Input
                  type="email"
                  placeholder="employee@company.com"
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </FormField>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <a
                    href="#forgot-password"
                    onClick={(e) => {
                      e.preventDefault();
                      setErrorMessage('Password reset is managed by your system administrator.');
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  icon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm"
                loading={isLoading}
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 1-Click Fast Login for Backend Seeded Rows */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Backend Seeded Users (1-Click Login)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Passw0rd123</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {SEEDED_BACKEND_USERS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleSelectPreconfiguredUser(acc)}
                className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left text-xs group"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 group-hover:text-blue-700">
                      {acc.name}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${acc.badge}`}>
                      {acc.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">{acc.email}</div>
                </div>
                <span className="text-[11px] font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Sign in →
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Enterprise Notice matching wireframe */}
        <div className="text-center space-y-1 px-4 text-xs text-slate-500">
          <p className="font-medium text-slate-600">
            Accounts are created by an administrator.
          </p>
          <p className="text-[11px] text-slate-400">
            After sign-in, you will access only the modules and actions permitted by your assigned role.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
