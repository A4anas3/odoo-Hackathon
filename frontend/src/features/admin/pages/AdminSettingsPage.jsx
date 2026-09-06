import React from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { ShieldCheck, Database, Key, Server, CheckCircle2, Inbox } from 'lucide-react';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';

export function AdminSettingsPage() {
  const { user } = useCurrentUser();

  return (
    <PageContainer
      title="System Administration"
      description="Service connection health, microservice architecture status, and security keys."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monolithic Auth Status */}
        <Card>
          <CardHeader
            title="Authentication & RBAC"
            subtitle="Integrated Monolithic Security (Spring Boot HR)"
          />
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Service URL</span>
              <span className="font-mono font-semibold text-slate-800">http://localhost:9000</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Signature Algorithm</span>
              <span className="font-mono font-semibold text-slate-800">HS256 (Stateless HMAC-SHA256)</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Token Persistence</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Truly Stateless (No DB Token Tables)
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500">Role System</span>
              <span className="font-semibold text-slate-800">Typed Role Enum + Employee Linkage</span>
            </div>
          </CardContent>
        </Card>

        {/* Database & Backend Health */}
        <Card>
          <CardHeader
            title="Database & HR Backend"
            subtitle="PostgreSQL instance and Spring Boot REST API"
          />
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">HR Microservice Port</span>
              <span className="font-mono font-semibold text-slate-800">9000</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">PostgreSQL Host & Port</span>
              <span className="font-mono font-semibold text-slate-800">localhost:5433</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Schema Management</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Spring JPA & PostgreSQL Dialect
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500">Frontend Dev Port</span>
              <span className="font-semibold text-slate-800">5173 (Vite Proxy)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Session Information */}
      <Card>
        <CardHeader
          title="Current Admin Session"
          subtitle="Security context information for the logged-in administrator"
        />
        <CardContent className="p-4">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Authenticated Identity</span>
              <span className="font-mono font-semibold text-slate-800">{user?.email || user?.username || 'admin'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Assigned Roles</span>
              <span className="font-mono font-semibold text-purple-700">
                {user?.roles?.join(', ') || 'ROLE_ADMIN'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Session Type</span>
              <span className="font-semibold text-emerald-700">JWT Bearer (Valid)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
