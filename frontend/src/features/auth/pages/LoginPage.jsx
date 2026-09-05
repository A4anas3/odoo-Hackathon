import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { authApi } from '../api/authApi';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/form/Input';
import { FormField } from '../../../components/form/FormField';
import { Checkbox } from '../../../components/form/Checkbox';
import { Card, CardContent } from '../../../components/ui/Card';
import { Lock, Mail, ShieldAlert, Sparkles, User, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '../../../config/routes';

// Pre-seeded demo credentials matching auth-service & HR domain
const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    email: 'admin@company.com',
    password: 'Passw0rd123',
    name: 'Sarah Connor',
    desc: 'Lead Admin & Eng',
    badge: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    role: 'HR Manager',
    email: 'hrmanager@company.com',
    password: 'Passw0rd123',
    name: 'Michael Scott',
    desc: 'HR Director & Approver',
    badge: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    role: 'Employee',
    email: 'employee@company.com',
    password: 'Passw0rd123',
    name: 'Dwight Schrute',
    desc: 'Senior Sales Exec',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    role: 'Employee',
    email: 'pam@company.com',
    password: 'Passw0rd123',
    name: 'Pam Beesly',
    desc: 'Marketing Lead',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    role: 'Admin',
    email: 'admin@odoo.com',
    password: 'Passw0rd123',
    name: 'Odoo Admin',
    desc: 'System Admin Suite',
    badge: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    role: 'HR Manager',
    email: 'manager@odoo.com',
    password: 'Passw0rd123',
    name: 'Odoo Manager',
    desc: 'Operations Manager',
    badge: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    role: 'Employee',
    email: 'alice@example.com',
    password: 'Passw0rd123',
    name: 'Alice Smith',
    desc: 'Staff Member',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useCurrentUser();

  // Mode: 'signin' | 'signup'
  const [mode, setMode] = useState('signin');

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (mode === 'signin') {
      if (!email || !password) {
        setErrorMessage('Please enter both email and password.');
        return;
      }

      setIsLoading(true);
      try {
        const response = await authApi.login({ email, password });
        login(response);
        navigate(from, { replace: true });
      } catch (err) {
        setErrorMessage(err.message || 'Invalid credentials. Please verify and try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Sign Up
      if (!username || !email || !password) {
        setErrorMessage('Please complete all required fields.');
        return;
      }

      setIsLoading(true);
      try {
        await authApi.register({ username, email, password });
        // Automatically sign in with newly registered credentials
        const loginResponse = await authApi.login({ email, password });
        login(loginResponse);
        navigate(from, { replace: true });
      } catch (err) {
        setErrorMessage(err.message || 'Registration failed. The username or email may already be registered.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    authApi
      .login({ email: demoEmail, password: demoPassword })
      .then((res) => {
        login(res);
        navigate(from, { replace: true });
      })
      .catch((err) => {
        setErrorMessage(err.message || 'Quick login failed. Ensure auth-service is running.');
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-screen w-full bg-[#F8F9FA] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#714B67] text-white font-bold text-2xl shadow-md mb-1">
            O
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Odoo HRMS</h1>
          <p className="text-xs text-slate-500">HR & Payroll Enterprise Suite</p>
        </div>

        {/* Auth Card */}
        <Card className="border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage('');
              }}
              className={`flex-1 py-3 text-xs font-semibold tracking-wide transition-colors ${
                mode === 'signin'
                  ? 'bg-white text-[#714B67] border-b-2 border-[#714B67]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage('');
              }}
              className={`flex-1 py-3 text-xs font-semibold tracking-wide transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-[#714B67] border-b-2 border-[#714B67]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign Up (Register)
            </button>
          </div>

          <CardContent className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2.5 text-xs text-rose-800">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-start gap-2.5 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <FormField label="Username" required>
                  <Input
                    type="text"
                    placeholder="johndoe"
                    icon={User}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </FormField>
              )}

              <FormField label="Work Email" required>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </FormField>

              <FormField
                label="Password"
                required
                helperText={mode === 'signup' ? 'Min 8 characters, 1 uppercase (A-Z), 1 lowercase (a-z), and 1 number (0-9)' : undefined}
              >
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  icon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                />
              </FormField>

              {mode === 'signin' && (
                <div className="flex items-center justify-between pt-0.5">
                  <Checkbox
                    label="Remember me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">
                    Forgot password?
                  </span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            {/* Switch Mode Prompt */}
            <div className="text-center text-xs text-slate-500 pt-1">
              {mode === 'signin' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMessage('');
                    }}
                    className="font-semibold text-[#714B67] hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMessage('');
                    }}
                    className="font-semibold text-[#714B67] hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>

            {/* Quick Demo Accounts */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#714B67]" /> 1-Click Demo Accounts (All {DEMO_ACCOUNTS.length})
                </p>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                  Pass: Passw0rd123
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-0.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickLogin(acc.email, acc.password)}
                    disabled={isLoading}
                    className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 bg-white hover:bg-purple-50/30 hover:border-[#714B67]/50 transition text-left group disabled:opacity-50 shadow-2xs"
                  >
                    <div className="w-7 h-7 rounded-md bg-[#714B67]/10 text-[#714B67] flex items-center justify-center font-bold text-xs shrink-0">
                      {acc.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-[#714B67] truncate">
                          {acc.name}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium shrink-0 border ${acc.badge}`}>
                          {acc.role}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 font-mono truncate">{acc.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400">
          Powered by Centralized RS256 Auth Microservice
        </p>
      </div>
    </div>
  );
}
