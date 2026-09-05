import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Tabs } from '../../../components/ui/Tabs';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/loading/Spinner';
import { ErrorState } from '../../../components/error/ErrorState';
import { useEmployee } from '../hooks/useEmployees';
import { formatDate, formatCurrency } from '../../../lib/utils/formatters';
import { ROUTES } from '../../../config/routes';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  CreditCard,
  FileText,
  Clock,
  Coins,
  Edit2,
  Shield,
} from 'lucide-react';

export function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: employee, isLoading, isError, refetch } = useEmployee(id);

  if (isLoading) {
    return (
      <PageContainer title="Employee Profile">
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !employee) {
    return (
      <PageContainer title="Employee Profile">
        <ErrorState message="Could not find the requested employee record." onRetry={refetch} />
      </PageContainer>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Briefcase },
    { id: 'contract', label: 'Contract & Compensation', icon: FileText },
    { id: 'attendance', label: 'Attendance Records', icon: Clock },
    { id: 'payroll', label: 'Payslips & History', icon: Coins },
  ];

  return (
    <PageContainer
      title={`${employee.firstName} ${employee.lastName}`}
      description={`Code: ${employee.employeeCode || 'EMP-000'} • Joined ${formatDate(employee.joiningDate)}`}
      actions={
        <Button
          variant="secondary"
          size="sm"
          icon={Edit2}
          onClick={() => navigate(ROUTES.EMPLOYEE_EDIT(employee.id))}
        >
          Edit Profile
        </Button>
      }
    >
      {/* Top Profile Summary Header Card */}
      <Card className="border border-slate-200/90 shadow-2xs">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={`${employee.firstName} ${employee.lastName}`} size="xl" />
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-slate-900">
                    {employee.firstName} {employee.lastName}
                  </h2>
                  <StatusBadge status={employee.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span>{employee.jobPosition?.name || 'Position Not Assigned'}</span>
                  <span>•</span>
                  <span>{employee.department?.name || 'Department Not Assigned'}</span>
                </p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {employee.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {employee.phone || 'No phone'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {employee.address || 'Address not registered'}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-lg text-right min-w-[140px]">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                Employment Type
              </span>
              <span className="text-xs font-bold text-[#714B67] mt-0.5 block">
                {employee.employeeType?.replace('_', ' ') || 'FULL TIME'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Organization Information" />
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-800">{employee.department?.name || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Job Title</span>
                <span className="font-semibold text-slate-800">{employee.jobPosition?.name || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Manager / Supervisor</span>
                <span className="font-semibold text-slate-800">{employee.manager?.firstName ? `${employee.manager.firstName} ${employee.manager.lastName}` : 'Direct Report (None)'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Date of Joining</span>
                <span className="font-semibold text-slate-800">{formatDate(employee.joiningDate)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Banking & Payroll Details" />
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Bank Name</span>
                <span className="font-semibold text-slate-800">{employee.bankName || 'Silicon Valley Bank'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Account Number</span>
                <span className="font-mono font-semibold text-slate-800">{employee.bankAccountNo || '•••• 9482'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">IFSC / Routing Code</span>
                <span className="font-mono font-semibold text-slate-800">{employee.ifscCode || 'SVB00192'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Tax Identifier</span>
                <span className="font-mono font-semibold text-slate-800">TX-902-881</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'contract' && (
        <Card>
          <CardHeader
            title="Employment Contract"
            subtitle="Active terms, salary structure, and scheduled working hours"
          />
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold block">Monthly Wage</span>
                <span className="text-lg font-bold text-slate-900 mt-1 block">{formatCurrency(6500)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold block">Salary Structure</span>
                <span className="text-sm font-semibold text-slate-900 mt-1 block">Full-time Regular</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold block">Working Schedule</span>
                <span className="text-sm font-semibold text-slate-900 mt-1 block">Standard 40h / Week</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-50 px-3.5 py-2.5 font-semibold text-slate-700 border-b border-slate-200">
                Salary Component Breakdown
              </div>
              <div className="divide-y divide-slate-100">
                <div className="px-3.5 py-2 flex justify-between">
                  <span>Basic Salary (50%)</span>
                  <span className="font-semibold">{formatCurrency(3250)}</span>
                </div>
                <div className="px-3.5 py-2 flex justify-between">
                  <span>House Rent Allowance (HRA 25%)</span>
                  <span className="font-semibold">{formatCurrency(1625)}</span>
                </div>
                <div className="px-3.5 py-2 flex justify-between">
                  <span>Special Allowance</span>
                  <span className="font-semibold">{formatCurrency(1625)}</span>
                </div>
                <div className="px-3.5 py-2 flex justify-between bg-slate-50/50 font-bold text-slate-900">
                  <span>Total Gross</span>
                  <span>{formatCurrency(6500)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'attendance' && (
        <Card>
          <CardHeader title="Recent Attendance Logs" />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Check In</th>
                    <th className="p-3">Check Out</th>
                    <th className="p-3">Worked Hours</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-medium">04 Sep 2026</td>
                    <td className="p-3">09:02 AM</td>
                    <td className="p-3">06:05 PM</td>
                    <td className="p-3">8h 03m</td>
                    <td className="p-3"><StatusBadge status="PRESENT" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">03 Sep 2026</td>
                    <td className="p-3">08:58 AM</td>
                    <td className="p-3">05:59 PM</td>
                    <td className="p-3">8h 01m</td>
                    <td className="p-3"><StatusBadge status="PRESENT" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">02 Sep 2026</td>
                    <td className="p-3">09:25 AM</td>
                    <td className="p-3">06:15 PM</td>
                    <td className="p-3">7h 50m</td>
                    <td className="p-3"><StatusBadge status="LATE" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'payroll' && (
        <Card>
          <CardHeader title="Issued Payslips" />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Period</th>
                    <th className="p-3">Gross Salary</th>
                    <th className="p-3">Deductions</th>
                    <th className="p-3">Net Pay</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-medium">August 2026</td>
                    <td className="p-3">{formatCurrency(6500)}</td>
                    <td className="p-3 text-rose-600">{formatCurrency(650)}</td>
                    <td className="p-3 font-bold text-emerald-700">{formatCurrency(5850)}</td>
                    <td className="p-3"><StatusBadge status="PAID" /></td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="xs">View Payslip</Button>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">July 2026</td>
                    <td className="p-3">{formatCurrency(6500)}</td>
                    <td className="p-3 text-rose-600">{formatCurrency(650)}</td>
                    <td className="p-3 font-bold text-emerald-700">{formatCurrency(5850)}</td>
                    <td className="p-3"><StatusBadge status="PAID" /></td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="xs">View Payslip</Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
