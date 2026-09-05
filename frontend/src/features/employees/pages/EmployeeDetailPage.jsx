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
import { useEmployee, useUpdateEmployee } from '../hooks/useEmployees';
import { useQuery } from '@tanstack/react-query';
import { contractApi } from '../../contracts/api/contractApi';
import { attendanceApi } from '../../attendance/api/attendanceApi';
import { formatDate, formatCurrency, formatTime, formatHours } from '../../../lib/utils/formatters';
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
  UserX,
  UserCheck,
  Inbox,
  Plus,
} from 'lucide-react';

export function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: employee, isLoading, isError, refetch } = useEmployee(id);
  const updateMutation = useUpdateEmployee();

  const { data: contracts = [], isLoading: isContractsLoading } = useQuery({
    queryKey: ['contracts', 'employee', id],
    queryFn: () => contractApi.getContractsByEmployeeId(id),
    enabled: !!id,
  });
  const activeContract = contracts.find((c) => c.status === 'RUNNING') || contracts[0] || null;

  const { data: attendanceLogs = [], isLoading: isAttendanceLoading } = useQuery({
    queryKey: ['attendance', 'employee', id],
    queryFn: () => attendanceApi.getEmployeeAttendance(id),
    enabled: !!id,
  });

  const handleStatusChange = async (newStatus) => {
    await updateMutation.mutateAsync({
      id: employee.id,
      data: { status: newStatus },
    });
    refetch();
  };

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
        <div className="flex items-center gap-2">
          {employee.status === 'ACTIVE' ? (
            <Button
              variant="danger"
              size="sm"
              icon={UserX}
              isLoading={updateMutation.isPending}
              onClick={() => handleStatusChange('INACTIVE')}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={UserCheck}
              isLoading={updateMutation.isPending}
              onClick={() => handleStatusChange('ACTIVE')}
            >
              Reactivate
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={Edit2}
            onClick={() => navigate(ROUTES.EMPLOYEE_EDIT(employee.id))}
          >
            Edit Profile
          </Button>
        </div>
      }
    >
      {/* Non-Active Status Warning Banner */}
      {employee.status !== 'ACTIVE' && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold text-amber-900 block">Employment Status: {employee.status}</span>
              <p className="mt-0.5 text-amber-700">
                This employee cannot punch attendance shifts, apply for time off, or be included in monthly pay runs.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => handleStatusChange('ACTIVE')}
            isLoading={updateMutation.isPending}
          >
            Make Active
          </Button>
        </div>
      )}

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
                <span className="font-semibold text-slate-800">{employee.managerName || (employee.manager?.firstName ? `${employee.manager.firstName} ${employee.manager.lastName}` : 'Direct Report (None)')}</span>
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
                <span className="font-semibold text-slate-800">{employee.bankName || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Account Number</span>
                <span className="font-mono font-semibold text-slate-800">{employee.bankAccountNo || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">IFSC / Routing Code</span>
                <span className="font-mono font-semibold text-slate-800">{employee.ifscCode || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Tax Identifier</span>
                <span className="font-mono font-semibold text-slate-800">{employee.taxIdentifier || '—'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'contract' && (
        <Card>
          <CardHeader
            title="Employment Contract"
            subtitle="Active terms, salary structure, and compensation terms"
            actions={
              !activeContract && (
                <Button
                  variant="primary"
                  size="xs"
                  icon={Plus}
                  onClick={() => navigate(ROUTES.CONTRACT_NEW, { state: { employeeId: employee.id } })}
                >
                  Create Contract
                </Button>
              )
            }
          />
          <CardContent className="p-4 space-y-4">
            {activeContract ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[11px] text-slate-400 font-semibold block">Monthly Wage</span>
                    <span className="text-lg font-bold text-slate-900 mt-1 block">
                      {activeContract.salary != null ? formatCurrency(activeContract.salary) : '—'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[11px] text-slate-400 font-semibold block">Salary Structure</span>
                    <span className="text-sm font-semibold text-slate-900 mt-1 block">
                      {activeContract.salaryStructureName || 'Standard Structure'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[11px] text-slate-400 font-semibold block">Contract Status</span>
                    <div className="mt-1">
                      <StatusBadge status={activeContract.status || 'RUNNING'} />
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <div className="bg-slate-50 px-3.5 py-2.5 font-semibold text-slate-700 border-b border-slate-200">
                    Contract Parameters
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="px-3.5 py-2 flex justify-between">
                      <span className="text-slate-500">Effective Period</span>
                      <span className="font-semibold text-slate-800">
                        {formatDate(activeContract.startDate)} – {activeContract.endDate ? formatDate(activeContract.endDate) : 'Indefinite'}
                      </span>
                    </div>
                    <div className="px-3.5 py-2 flex justify-between">
                      <span className="text-slate-500">Contract Reference</span>
                      <span className="font-mono text-slate-800">{activeContract.name || activeContract.id?.slice(0, 8) || '—'}</span>
                    </div>
                    <div className="px-3.5 py-2 flex justify-between bg-slate-50/50 font-bold text-slate-900">
                      <span>Agreed Wage</span>
                      <span>{activeContract.salary != null ? formatCurrency(activeContract.salary) : '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-1 stroke-1" />
                No active employment contract found for this employee.
              </div>
            )}
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
                  {attendanceLogs.length > 0 ? (
                    attendanceLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-medium">{formatDate(log.attendanceDate)}</td>
                        <td className="p-3 font-mono">{log.checkIn ? formatTime(log.checkIn) : '—'}</td>
                        <td className="p-3 font-mono">{log.checkOut ? formatTime(log.checkOut) : '—'}</td>
                        <td className="p-3">{log.workedHours > 0 ? formatHours(log.workedHours) : '—'}</td>
                        <td className="p-3"><StatusBadge status={log.status || 'PRESENT'} /></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-1 stroke-1" />
                        No attendance records logged for this employee.
                      </td>
                    </tr>
                  )}
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
            <div className="py-12 text-center text-slate-400">
              <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-1 stroke-1" />
              No individual payroll disbursements found for this profile.
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
