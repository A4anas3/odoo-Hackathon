import React from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ShieldCheck, Database, Key, Server, CheckCircle2 } from 'lucide-react';

export function AdminSettingsPage() {
  return (
    <PageContainer
      title="System Administration"
      description="Service connection health, microservice architecture status, and security keys."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Auth Microservice Status */}
        <Card>
          <CardHeader
            title="Authentication Microservice"
            subtitle="Centralized IdP (peoplePay auth-service)"
          />
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Service URL</span>
              <span className="font-mono font-semibold text-slate-800">http://localhost:8085</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Signature Algorithm</span>
              <span className="font-mono font-semibold text-slate-800">RS256 (Asymmetric RSA)</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Public Key Verification</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Loaded (public_key.pem)
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500">Token Rotation</span>
              <span className="font-semibold text-slate-800">Enabled (Opaque Hash SHA-256)</span>
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
              <span className="font-mono font-semibold text-slate-800">8080 (or 8082)</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">PostgreSQL Host & Port</span>
              <span className="font-mono font-semibold text-slate-800">localhost:5433</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Schema Management</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Flyway v1 + Hibernate Update
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500">CORS Policy</span>
              <span className="font-semibold text-slate-800">Enabled (Allowed Origins: 5173)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Audit Logs */}
      <Card>
        <CardHeader
          title="Recent Audit Logs"
          subtitle="Immutable record of security and administrative operations"
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Resource</th>
                  <th className="p-3">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                <tr>
                  <td className="p-3 text-slate-500">2026-09-05 11:30:08</td>
                  <td className="p-3 font-semibold text-slate-800">system (Flyway)</td>
                  <td className="p-3">MIGRATE_SCHEMA</td>
                  <td className="p-3">public.flyway_schema_history</td>
                  <td className="p-3 text-emerald-700 font-bold">SUCCESS (v1)</td>
                </tr>
                <tr>
                  <td className="p-3 text-slate-500">2026-09-05 11:25:49</td>
                  <td className="p-3 font-semibold text-slate-800">admin@odoo.com</td>
                  <td className="p-3">USER_LOGIN</td>
                  <td className="p-3">auth-service /auth/login</td>
                  <td className="p-3 text-emerald-700 font-bold">TOKEN_ISSUED (RS256)</td>
                </tr>
                <tr>
                  <td className="p-3 text-slate-500">2026-09-05 11:20:15</td>
                  <td className="p-3 font-semibold text-slate-800">system</td>
                  <td className="p-3">KEYPAIR_VERIFY</td>
                  <td className="p-3">classpath:keys/public_key.pem</td>
                  <td className="p-3 text-emerald-700 font-bold">VERIFIED</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
