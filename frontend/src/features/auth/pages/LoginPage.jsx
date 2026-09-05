import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { authApi } from '../api/authApi';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/form/Input';
import { FormField } from '../../../components/form/FormField';
import { Checkbox } from '../../../components/form/Checkbox';
import { Card, CardContent } from '../../../components/ui/Card';
import { Lock, Mail, ShieldAlert, Sparkles } from 'lucide-react';
import { ROUTES } from '../../../config/routes';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useCurrentUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await authApi.login({ email, password });
      login(response);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid credentials. Please verify and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsLoading(true);
    authApi
      .login({ email: demoEmail, password: demoPassword })
      .then((res) => {
        login(res);
        navigate(from, { replace: true });
      })
      .catch((err) => {
        setErrorMessage(err.message || 'Quick login failed');
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-screen w-full bg-[#F8F9FA] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#714B67] text-white font-bold text-2xl shadow-md mb-1">
            O
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Odoo HRMS</h1>
          <p className="text-xs text-slate-500">Sign in to access HR & Payroll Enterprise Suite</p>
        </div>

        {/* Login Card */}
        <Card className="border border-slate-200/90 shadow-sm">
          <CardContent className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2.5 text-xs text-rose-800">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <FormField label="Password" required>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  icon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </FormField>

              <div className="flex items-center justify-between pt-1">
                <Checkbox
                  label="Remember me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">
                  Forgot password?
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </form>

            {/* Quick Demo Logins */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-[#714B67]" /> Demo Accounts (1-Click)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleQuickLogin('admin@odoo.com', 'Passw0rd123')}
                  disabled={isLoading}
                  className="text-[11px]"
                >
                  Admin
                </Button>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleQuickLogin('manager@odoo.com', 'Passw0rd123')}
                  disabled={isLoading}
                  className="text-[11px]"
                >
                  HR Manager
                </Button>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleQuickLogin('alice@example.com', 'Passw0rd123')}
                  disabled={isLoading}
                  className="text-[11px]"
                >
                  Employee
                </Button>
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
