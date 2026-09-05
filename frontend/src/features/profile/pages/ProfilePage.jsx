import React from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { useMyProfile } from '../../employees/hooks/useEmployees';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { formatDate, formatCurrency } from '../../../lib/utils/formatters';
import { Mail, Phone, MapPin, Building2, Briefcase, Calendar, ShieldCheck } from 'lucide-react';

export function ProfilePage() {
  const { user } = useCurrentUser();
  const { data: profile = {}, isLoading } = useMyProfile();

  return (
    <PageContainer
      title="My Employee Profile"
      description="Personal employment records, direct deposit details, and active contract summary."
    >
      {/* Profile Header */}
      <Card className="border border-slate-200 shadow-2xs">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={profile.firstName ? `${profile.firstName} ${profile.lastName}` : (user?.email || 'User')} size="xl" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    {profile.firstName ? `${profile.firstName} ${profile.lastName}` : (user?.email?.split('@')[0] || 'User')}
                  </h2>
                  <StatusBadge status={profile.status || 'ACTIVE'} />
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span>{profile.jobPosition?.name || 'Senior Fullstack Engineer'}</span>
                  <span>•</span>
                  <span>{profile.department?.name || 'Engineering'}</span>
                </p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {profile.email || user?.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {profile.phone || '+1 555-0192'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {profile.address || '100 Cyberdyne Way, Tech City'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-lg text-right min-w-[150px]">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                System Role
              </span>
              <span className="text-xs font-bold text-[#714B67] mt-0.5 block flex items-center justify-end gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {user?.roles?.[0]?.replace(/^ROLE_/, '') || 'EMPLOYEE'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Employment Placement" />
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Employee Code</span>
              <span className="font-mono font-semibold text-slate-800">{profile.employeeCode || 'EMP-001'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Department</span>
              <span className="font-semibold text-slate-800">{profile.department?.name || 'Engineering'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Designation</span>
              <span className="font-semibold text-slate-800">{profile.jobPosition?.name || 'Senior Fullstack Engineer'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Joining Date</span>
              <span className="font-semibold text-slate-800">{formatDate(profile.joiningDate || '2023-01-15')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Current Contract & Compensation" />
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Monthly Gross Salary</span>
              <span className="font-bold text-slate-900">{formatCurrency(6500)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Salary Structure</span>
              <span className="font-semibold text-slate-800">Regular Full-Time</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Direct Deposit Bank</span>
              <span className="font-semibold text-slate-800">{profile.bankName || 'Silicon Valley Bank'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Account Number</span>
              <span className="font-mono font-semibold text-slate-800">{profile.bankAccountNo || '•••• 4892'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
