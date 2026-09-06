import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/loading/Spinner';
import { ErrorState } from '../../../components/error/ErrorState';
import { useEmployee, useUpdateEmployee } from '../hooks/useEmployees';
import { useQuery } from '@tanstack/react-query';
import { contractApi } from '../../contracts/api/contractApi';
import { attendanceApi } from '../../attendance/api/attendanceApi';
import { timeoffApi } from '../../timeoff/api/timeOffApi';
import { formatDate, formatCurrency } from '../../../lib/utils/formatters';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { ROUTES } from '../../../config/routes';
import {
  Edit2,
  CalendarDays,
  FileText,
  Clock,
  Shield,
  UserX,
  UserCheck,
  Building2,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  Layers,
  Coins,
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
  History,
  Plus,
  ArrowRight,
  ExternalLink,
  Inbox,
} from 'lucide-react';

export function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Wireframe tabs: 'work' (Work Information) and 'private' (Private Information)
  const [activeTab, setActiveTab] = useState('work');

  const { data: employee, isLoading, isError, refetch } = useEmployee(id);
  const updateMutation = useUpdateEmployee();

  // Related data for Smart Buttons
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', 'employee', id],
    queryFn: () => contractApi.getContractsByEmployeeId(id),
    enabled: !!id,
  });

  const { data: attendanceLogs = [] } = useQuery({
    queryKey: ['attendance', 'employee', id],
    queryFn: () => attendanceApi.getEmployeeAttendance(id),
    enabled: !!id,
  });

  const { data: allTimeOff = [] } = useQuery({
    queryKey: ['time-off', 'all'],
    queryFn: () => timeoffApi.getAllRequests(),
  });

  const { data: allocations = [] } = useQuery({
    queryKey: ['allocations', 'employee', id],
    queryFn: () => timeoffApi.getAllocations(id),
    enabled: !!id,
  });

  const employeeTimeOffCount = allTimeOff.filter(
    (req) => req.employeeId === id || req.employee?.id === id || req.employeeEmail === employee?.email
  ).length;

  const [selectedRole, setSelectedRole] = useState('EMPLOYEE');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [roleSuccessMessage, setRoleSuccessMessage] = useState('');
  const [roleErrorMessage, setRoleErrorMessage] = useState('');

  React.useEffect(() => {
    if (employee?.role) {
      setSelectedRole(employee.role);
    }
  }, [employee?.role]);

  const handleUpdateRole = async () => {
    setIsUpdatingRole(true);
    setRoleSuccessMessage('');
    setRoleErrorMessage('');
    try {
      await updateMutation.mutateAsync({
        id: employee.id,
        data: { role: selectedRole },
      });
      setRoleSuccessMessage(`Role successfully updated to ${selectedRole}.`);
      refetch();
    } catch (err) {
      setRoleErrorMessage(err.response?.data?.message || err.message || 'Failed to update role.');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword.trim()) return;
    setIsUpdatingPassword(true);
    setRoleSuccessMessage('');
    setRoleErrorMessage('');
    try {
      await updateMutation.mutateAsync({
        id: employee.id,
        data: { password: newPassword.trim() },
      });
      setRoleSuccessMessage('Password updated successfully.');
      setNewPassword('');
    } catch (err) {
      setRoleErrorMessage(err.response?.data?.message || err.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const activeContract = contracts.find((c) => (c.status || '').toUpperCase() === 'RUNNING') || contracts[0];

  const getRoleBadgeStyle = (roleStr) => {
    const r = String(roleStr || '').toUpperCase();
    if (r.includes('ADMIN')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (r.includes('MANAGER')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (r.includes('PAYROLL')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

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

  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase() || 'EM';
  const fullName = `${employee.firstName} ${employee.lastName}`;
  const jobTitle = employee.jobPositionTitle || employee.jobPosition?.title || employee.jobPosition?.name || 'Staff Member';
  const deptName = employee.departmentName || employee.department?.name || 'General';

  return (
    <PageContainer
      title={
        <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900">
          <span>Employee / {fullName}</span>
        </div>
      }
      description="Main employee form with related HR actions"
      actions={
        <div className="flex items-center gap-2">
          {employee.status === 'ACTIVE' ? (
            <Button
              variant="outline"
              size="sm"
              icon={UserX}
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
              isLoading={updateMutation.isPending}
              onClick={() => handleStatusChange('INACTIVE')}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              icon={UserCheck}
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              isLoading={updateMutation.isPending}
              onClick={() => handleStatusChange('ACTIVE')}
            >
              Reactivate
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            icon={Edit2}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => navigate(ROUTES.EMPLOYEE_EDIT(employee.id))}
          >
            EDIT
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Main Employee Record Card */}
        <Card className="border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Top Bar: Edit & Smart Buttons matching wireframe */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(ROUTES.EMPLOYEE_EDIT(employee.id))}
                className="font-bold border-slate-300 text-slate-800 hover:bg-white"
              >
                EDIT
              </Button>
            </div>

            {/* Smart Buttons on top right */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => navigate(`${ROUTES.TIMEOFF_REQUESTS}?employeeId=${employee.id}`)}
                className="px-3.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-blue-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                title="View related time off records"
              >
                <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                <span>Time Off {employeeTimeOffCount}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`${ROUTES.CONTRACTS}?employeeId=${employee.id}`)}
                className="px-3.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-blue-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                title="View related contracts"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Contracts {contracts.length}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`${ROUTES.ATTENDANCE}?employeeId=${employee.id}`)}
                className="px-3.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-blue-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                title="View related attendance logs"
              >
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Attendance {attendanceLogs.length}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`${ROUTES.TIMEOFF_ALLOCATIONS}?employeeId=${employee.id}`)}
                className="px-3.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-blue-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                title="View related leave allocations"
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Allocations {allocations.length}</span>
              </button>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Header Persona Box matching wireframe */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xl flex items-center justify-center shrink-0 shadow-xs">
                {initials}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeStyle(employee.role || 'EMPLOYEE')}`}>
                    {employee.role || 'EMPLOYEE'}
                  </span>
                  {activeContract?.salary && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Package: {formatCurrency(Number(activeContract.salary) * 12)} / yr
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-600">
                  {jobTitle} • {deptName}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  {employee.email || '—'} {employee.phone ? `| ${employee.phone}` : ''}
                </p>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-slate-200 flex gap-6 text-sm font-semibold flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('work')}
                className={`pb-2.5 transition-colors relative ${
                  activeTab === 'work'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Work Information
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('package')}
                className={`pb-2.5 transition-colors relative flex items-center gap-1.5 ${
                  activeTab === 'package'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Contracts & History</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold border border-slate-200">
                  {contracts.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('access')}
                className={`pb-2.5 transition-colors relative flex items-center gap-1.5 ${
                  activeTab === 'access'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Key className="w-3.5 h-3.5 text-blue-600" />
                <span>User Account & Role</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('private')}
                className={`pb-2.5 transition-colors relative ${
                  activeTab === 'private'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Private Information
              </button>
            </div>

            {/* Tab 1: Work Information */}
            {activeTab === 'work' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs sm:text-sm">
                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Department</span>
                  <span className="font-semibold text-slate-800">{deptName}</span>
                </div>

                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Job Position</span>
                  <span className="font-semibold text-slate-800">{jobTitle}</span>
                </div>

                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Joining Date</span>
                  <span className="font-semibold text-slate-800">
                    {employee.joiningDate ? formatDate(employee.joiningDate) : '—'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Employment Type</span>
                  <span className="font-semibold text-slate-800">
                    {employee.employeeType || 'Full-Time'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Work Location</span>
                  <span className="font-semibold text-slate-800">Main Headquarters</span>
                </div>

                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Working Schedule</span>
                  <span className="font-semibold text-slate-800">
                    {employee.workingScheduleName || (contracts.find((c) => (c.status || '').toUpperCase() === 'RUNNING')?.workingScheduleName) || '40 Hours / Week'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Status</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {employee.status || 'Active'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Contracts on Record</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('package')}
                    className="text-left font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                  >
                    <span>{contracts.length} Contract(s) on file</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Company</span>
                  <span className="font-semibold text-slate-800">OXP Enterprise Suite</span>
                </div>

                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Work Email</span>
                  <span className="font-mono font-semibold text-slate-800">{employee.email || '—'}</span>
                </div>
              </div>
            )}

            {/* Tab 2: Contracts & Employment History */}
            {activeTab === 'package' && (
              <div className="space-y-6">
                {/* Package Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl shadow-2xs">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Annual Package (CTC)
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-emerald-950 mt-1 block">
                      {formatCurrency(Number(activeContract?.salary || 0) * 12)}
                    </span>
                    <span className="text-[11px] text-emerald-700 mt-1 block">
                      {activeContract ? 'Calculated from running contract' : 'No active contract enrolled'}
                    </span>
                  </div>

                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl shadow-2xs">
                    <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                      Monthly Base Wage
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-blue-950 mt-1 block">
                      {formatCurrency(Number(activeContract?.salary || 0))}
                    </span>
                    <span className="text-[11px] text-blue-700 mt-1 block">
                      Base monthly compensation rate
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                      Salary Structure
                    </span>
                    <span className="text-sm font-bold text-slate-800 mt-2 block truncate">
                      {activeContract?.salaryStructureName || 'Standard Structure'}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Payroll rules & calculation framework
                    </span>
                  </div>
                </div>

                {/* Detailed Active Contract Terms */}
                {activeContract && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs sm:text-sm pt-2">
                    <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-medium">Active Contract Status</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {activeContract.status || 'Active / Running'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-medium">Contract Type</span>
                      <span className="font-semibold text-slate-800">
                        {activeContract.contractType || 'Permanent / Full-Time'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-medium">Effective Tenure</span>
                      <span className="font-semibold text-slate-800">
                        {formatDate(activeContract.startDate) || '—'} to {formatDate(activeContract.endDate) || 'Indefinite'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-medium">Assigned Working Schedule</span>
                      <span className="font-semibold text-slate-800">
                        {activeContract.workingScheduleName || employee.workingScheduleName || '40 Hours / Week'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Contract & Employment History Table */}
                <div className="pt-4 border-t border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <History className="w-4 h-4 text-blue-600" />
                        <span>Contract & Employment History</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {contracts.length} {contracts.length === 1 ? 'Contract' : 'Contracts'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Historical and active employment contracts, compensation rates, and tenure
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        icon={Plus}
                        onClick={() => navigate(`${ROUTES.CONTRACT_NEW}?employeeId=${employee.id}`)}
                        className="text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50"
                      >
                        New Contract
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        icon={ExternalLink}
                        onClick={() => navigate(`${ROUTES.CONTRACTS}?employeeId=${employee.id}`)}
                        className="text-xs text-slate-600 hover:text-slate-900"
                      >
                        Manage in Contracts Module
                      </Button>
                    </div>
                  </div>

                  {contracts.length > 0 ? (
                    <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3.5">Contract / Type</th>
                            <th className="py-2.5 px-3.5">Salary Structure</th>
                            <th className="py-2.5 px-3.5">Tenure / Period</th>
                            <th className="py-2.5 px-3.5 text-right">Monthly Wage</th>
                            <th className="py-2.5 px-3.5 text-right">Annual CTC</th>
                            <th className="py-2.5 px-3.5 text-center">Status</th>
                            <th className="py-2.5 px-3.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {contracts.map((c) => (
                            <tr
                              key={c.id}
                              className="hover:bg-slate-50/70 transition-colors"
                            >
                              <td className="py-2.5 px-3.5 font-semibold text-slate-800">
                                {c.contractType || 'Full-Time Employment'}
                              </td>
                              <td className="py-2.5 px-3.5 text-slate-600">
                                {c.salaryStructureName || 'Standard Structure'}
                              </td>
                              <td className="py-2.5 px-3.5 text-slate-600">
                                <span>{formatDate(c.startDate) || '—'}</span>
                                <span className="text-slate-400 mx-1">→</span>
                                <span>{c.endDate ? formatDate(c.endDate) : 'Indefinite'}</span>
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-semibold text-slate-900">
                                {formatCurrency(c.salary || 0)}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-medium text-slate-600">
                                {formatCurrency(Number(c.salary || 0) * 12)}
                              </td>
                              <td className="py-2.5 px-3.5 text-center">
                                <StatusBadge status={c.status || 'DRAFT'} />
                              </td>
                              <td className="py-2.5 px-3.5 text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => navigate(ROUTES.CONTRACT_DETAIL(c.id))}
                                  className="text-blue-600 hover:text-blue-800 text-[11px]"
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-2 bg-slate-50/50">
                      <Inbox className="w-8 h-8 text-slate-300 stroke-1" />
                      <p className="text-xs font-semibold text-slate-700">No Employment Contracts on Record</p>
                      <p className="text-[11px] text-slate-500 max-w-sm">
                        Create an employment contract to define this employee's wage, salary structure, and official working schedule.
                      </p>
                      <Button
                        type="button"
                        variant="primary"
                        size="xs"
                        icon={Plus}
                        onClick={() => navigate(`${ROUTES.CONTRACT_NEW}?employeeId=${employee.id}`)}
                        className="mt-2 text-xs"
                      >
                        Create Contract
                      </Button>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(ROUTES.EMPLOYEE_EDIT(employee.id))}
                    className="text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50"
                  >
                    Edit Salary Package & Contract Terms →
                  </Button>
                </div>
              </div>
            )}

            {/* Tab 3: User Account & Role */}
            {activeTab === 'access' && (
              <div className="space-y-6">
                {roleSuccessMessage && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{roleSuccessMessage}</span>
                  </div>
                )}
                {roleErrorMessage && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{roleErrorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Role Assignment Card */}
                  <div className="p-5 bg-slate-50/50 border border-slate-200 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Workspace Role & RBAC</h4>
                        <p className="text-xs text-slate-500">Determines portal access permissions</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeStyle(employee.role || 'EMPLOYEE')}`}>
                        {employee.role || 'EMPLOYEE'}
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Change Assigned Role
                      </label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="EMPLOYEE">Employee (Personal records & punches)</option>
                        <option value="HR_MANAGER">HR Manager (Full staff records & approvals)</option>
                        <option value="HR_PAYROLL_USER">HR Payroll User (Payrun calculations)</option>
                        <option value="HR_PAYROLL_ADMIN">HR Payroll Admin (Salary rules & approvals)</option>
                        <option value="ADMIN">Admin (Full System & User Management)</option>
                      </select>

                      <div className="pt-2 flex justify-end">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={selectedRole === (employee.role || 'EMPLOYEE')}
                          isLoading={isUpdatingRole}
                          onClick={handleUpdateRole}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                        >
                          Update Role
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Password Reset Card */}
                  <div className="p-5 bg-slate-50/50 border border-slate-200 rounded-xl space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Password Update</h4>
                      <p className="text-xs text-slate-500">Update account password for {employee.email}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <label className="text-xs font-semibold text-slate-700 block">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (e.g. Passw0rd123)"
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />

                      <div className="pt-2 flex justify-end">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!newPassword.trim()}
                          isLoading={isUpdatingPassword}
                          onClick={handleUpdatePassword}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                        >
                          Update Password
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Details Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs sm:text-sm pt-2">
                  <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-medium">Work Login Email</span>
                    <span className="font-mono font-semibold text-slate-800">{employee.email || '—'}</span>
                  </div>

                  <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-medium">Account Access Status</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {employee.status === 'ACTIVE' ? 'Active (Login Enabled)' : 'Inactive / Suspended'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Private Information */}
            {activeTab === 'private' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs sm:text-sm">
                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Date of Birth</span>
                  <span className="font-semibold text-slate-800">{formatDate(employee.dateOfBirth) || '—'}</span>
                </div>

                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Residential Address</span>
                  <span className="font-semibold text-slate-800">{employee.address || '—'}</span>
                </div>

                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Bank Name</span>
                  <span className="font-semibold text-slate-800">{employee.bankName || '—'}</span>
                </div>

                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Bank Account Number</span>
                  <span className="font-mono font-semibold text-slate-800">{employee.bankAccountNo || '—'}</span>
                </div>

                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">IFSC / Routing Code</span>
                  <span className="font-mono font-semibold text-slate-800">{employee.ifscCode || '—'}</span>
                </div>

                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Emergency Contact Name</span>
                  <span className="font-semibold text-slate-800">{employee.emergencyContactName || '—'}</span>
                </div>

                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Emergency Contact Phone</span>
                  <span className="font-mono font-semibold text-slate-800">{employee.emergencyContactPhone || '—'}</span>
                </div>

                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Employee Code</span>
                  <span className="font-mono font-semibold text-slate-800">{employee.employeeCode || '—'}</span>
                </div>
              </div>
            )}
          </CardContent>

          {/* Wireframe footer note */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 italic">
            Useful note: smart buttons open related Contracts, Attendance, Time Off, and Allocations records filtered for the current employee.
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

export default EmployeeDetailPage;
