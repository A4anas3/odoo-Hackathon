import React, { useState } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader } from '../../../components/ui/Card';
import { StatCard } from '../../dashboard/components/StatCard';
import { DataTable } from '../../../components/table/DataTable';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/modal/Modal';
import { FormField } from '../../../components/form/FormField';
import { Input } from '../../../components/form/Input';
import { Select } from '../../../components/form/Select';
import { timeoffApi } from '../api/timeoffApi';
import { employeeApi } from '../../employees/api/employeeApi';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { useMyProfile } from '../../employees/hooks/useEmployees';
import { PERMISSIONS } from '../../../config/permissions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../hooks/useToast';
import { Calendar, Plus, CheckCircle2, Clock, CalendarDays, Plane, Users, UserCheck, AlertTriangle, Layers, X } from 'lucide-react';
import { formatDate } from '../../../lib/utils/formatters';
import { useSearchParams } from 'react-router-dom';

export function TimeOffPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = useCurrentUser();
  const { data: profile } = useMyProfile();
  const isEmployeeInactive = profile?.status && profile.status !== 'ACTIVE';
  const isAdminOrManager = can(PERMISSIONS.CAN_APPROVE_LEAVE);

  // Tab mode for Admins/Managers: 'company' (all staff) vs 'mine' (personal)
  const [viewMode, setViewMode] = useState(isAdminOrManager ? 'company' : 'mine');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Annual Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // New Type Modal State
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [newTypeData, setNewTypeData] = useState({
    name: '',
    description: '',
    paid: true,
    requiresApproval: true,
  });

  // Allocation Modal State
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [newAllocData, setNewAllocData] = useState({
    employeeId: '',
    timeOffTypeId: '',
    periodStart: '2026-01-01',
    periodEnd: '2026-12-31',
    allocatedDays: '',
  });

  // Query Employees (for allocation assignment)
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'list'],
    queryFn: () => employeeApi.getAllEmployees(),
    enabled: isAdminOrManager,
  });
  const allEmployees = employeesData?.content || (Array.isArray(employeesData) ? employeesData : []);

  // Query All Company Requests (only if admin/manager)
  const { data: allRequests = [], isLoading: isAllRequestsLoading } = useQuery({
    queryKey: ['timeoff', 'requests', 'all'],
    queryFn: () => timeoffApi.getAllRequests(),
    enabled: isAdminOrManager,
  });

  // Query Personal Requests
  const { data: myRequests = [], isLoading: isMyRequestsLoading } = useQuery({
    queryKey: ['timeoff', 'requests', 'my'],
    queryFn: () => timeoffApi.getMyRequests(),
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employeeId');

  // Query Allocations (Personal or filtered by employeeId when navigated from smart button)
  const { data: myAllocations = [], isLoading: isAllocationsLoading } = useQuery({
    queryKey: ['timeoff', 'allocations', employeeIdParam || 'my'],
    queryFn: () => (employeeIdParam ? timeoffApi.getAllocations(employeeIdParam) : timeoffApi.getMyAllocations()),
  });

  // Query Leave Types
  const { data: leaveTypes = [] } = useQuery({
    queryKey: ['timeoff', 'types'],
    queryFn: () => timeoffApi.getTypes(),
  });

  const submitMutation = useMutation({
    mutationFn: (data) => timeoffApi.submitRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff'] });
      toast.success('Leave application submitted successfully.');
      setIsModalOpen(false);
      setFormData({ type: 'Annual Leave', startDate: '', endDate: '', reason: '' });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to submit leave application.');
    },
  });

  const createTypeMutation = useMutation({
    mutationFn: (data) => timeoffApi.createTimeOffType(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['timeoff', 'types'] });
      toast.success(`Leave type "${created.name || 'New Type'}" created successfully.`);
      setIsTypeModalOpen(false);
      setNewTypeData({ name: '', description: '', paid: true, requiresApproval: true });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to create leave type.');
    },
  });

  const createAllocMutation = useMutation({
    mutationFn: (data) => timeoffApi.createAllocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff', 'allocations'] });
      toast.success('Leave balance allocated successfully.');
      setIsAllocModalOpen(false);
      setNewAllocData({ employeeId: '', timeOffTypeId: '', periodStart: '2026-01-01', periodEnd: '2026-12-31', allocatedDays: '' });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to allocate leave balance.');
    },
  });

  const handleRequest = () => {
    if (isEmployeeInactive) {
      toast.error('Time off requests are disabled for inactive accounts.');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select both start and end dates.');
      return;
    }
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) {
      toast.error('End date cannot be earlier than start date.');
      return;
    }
    const diffTime = Math.abs(end - start);
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    submitMutation.mutate({
      type: formData.type,
      timeOffTypeName: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      durationDays,
      reason: formData.reason,
    });
  };

  const isCompanyView = isAdminOrManager && viewMode === 'company';
  const currentRequests = isCompanyView ? allRequests : myRequests;
  const isRequestsLoading = isCompanyView ? isAllRequestsLoading : isMyRequestsLoading;

  // --- 1. Company-Wide Metrics (when in Company view) ---
  const companyTotalRequests = allRequests.length;
  const companyPending = allRequests.filter((r) => r.status === 'PENDING').length;
  const companyApproved = allRequests.filter((r) => r.status === 'APPROVED');
  const companyApprovedCount = companyApproved.length;
  const companyDaysTaken = companyApproved.reduce((sum, r) => sum + Number(r.duration || r.durationDays || 0), 0);

  // --- 2. Personal Metrics (when in My view or for standard employee) ---
  const annualAlloc =
    myAllocations.find((a) => (a.timeOffTypeName || a.timeOffType?.name || '').toLowerCase().includes('annual')) ||
    myAllocations[0];
  const sickAlloc = myAllocations.find((a) => (a.timeOffTypeName || a.timeOffType?.name || '').toLowerCase().includes('sick'));

  const annualTotal = Number(annualAlloc?.allocatedDays || annualAlloc?.numberOfDays || 0);
  const annualRemaining = Number(annualAlloc?.remainingDays != null ? annualAlloc.remainingDays : annualTotal);

  const sickTotal = Number(sickAlloc?.allocatedDays || sickAlloc?.numberOfDays || 0);
  const sickRemaining = Number(sickAlloc?.remainingDays != null ? sickAlloc.remainingDays : sickTotal);

  const myApprovedLeaves = myRequests.filter((r) => r.status === 'APPROVED');
  const myUsedDays = myApprovedLeaves.reduce((sum, r) => sum + Number(r.duration || r.durationDays || 0), 0);
  const myPendingCount = myRequests.filter((r) => r.status === 'PENDING').length;

  const columns = [
    ...(isCompanyView
      ? [
          {
            header: 'Employee',
            key: 'employee',
            render: (_, row) => {
              const name =
                row.employeeName ||
                row.employee?.name ||
                (row.employee?.firstName ? `${row.employee.firstName} ${row.employee.lastName || ''}`.trim() : 'Staff');
              const dept = row.departmentName || row.employee?.departmentName || row.employee?.department?.name || '—';
              return (
                <div>
                  <span className="font-semibold text-slate-800 block leading-tight">{name}</span>
                  <span className="text-[10px] text-slate-400">{dept}</span>
                </div>
              );
            },
          },
        ]
      : []),
    {
      header: 'Leave Type',
      key: 'timeOffTypeName',
      render: (type, row) => <span className="font-medium text-slate-700">{type || row.type || 'Leave'}</span>,
    },
    {
      header: 'Start Date',
      key: 'startDate',
      render: (date) => <span className="text-slate-600">{formatDate(date)}</span>,
    },
    {
      header: 'End Date',
      key: 'endDate',
      render: (date) => <span className="text-slate-600">{formatDate(date)}</span>,
    },
    {
      header: 'Duration',
      key: 'durationDays',
      render: (days, row) => {
        const count = days || row.duration || 1;
        return <span className="font-semibold text-slate-800">{count} {count === 1 ? 'day' : 'days'}</span>;
      },
    },
    {
      header: 'Reason',
      key: 'reason',
      render: (reason) => <span className="text-slate-500 truncate max-w-xs block">{reason || '—'}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (status) => <StatusBadge status={status || 'PENDING'} />,
    },
  ];

  const typeOptions =
    leaveTypes.length > 0
      ? leaveTypes.map((t) => t.name)
      : ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Unpaid Leave'];

  return (
    <PageContainer
      title={isCompanyView ? 'Time Off Management' : 'My Time Off'}
      description={
        isCompanyView
          ? 'Manage company-wide vacation days, allocations, and approval queues.'
          : 'Track your personal leave balances and submit time off requests.'
      }
      actions={
        <div className="flex items-center gap-2">
          {isAdminOrManager && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={Layers}
                onClick={() => setIsTypeModalOpen(true)}
              >
                New Leave Type
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={CalendarDays}
                onClick={() => setIsAllocModalOpen(true)}
              >
                Allocate Days
              </Button>
            </>
          )}
          <Button
            variant={isEmployeeInactive ? 'secondary' : 'primary'}
            size="sm"
            icon={Plus}
            disabled={isEmployeeInactive}
            title={isEmployeeInactive ? 'Leave requests are disabled for inactive accounts' : undefined}
            onClick={() => {
              if (isEmployeeInactive) {
                toast.error('Leave requests are disabled for inactive accounts.');
                return;
              }
              setIsModalOpen(true);
            }}
          >
            {isEmployeeInactive ? `Account ${profile?.status || 'Inactive'}` : 'Request Time Off'}
          </Button>
        </div>
      }
    >
      {/* Inactive Profile Alert Banner */}
      {isEmployeeInactive && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-900 block text-sm">
              Employment Status: {profile?.status || 'INACTIVE'}
            </span>
            <p className="mt-0.5 text-amber-700 leading-relaxed">
              Your employment account is currently marked as <strong>{profile?.status || 'INACTIVE'}</strong>. Time off requests and new leave submissions are strictly disabled. Please contact your HR administrator for assistance.
            </p>
          </div>
        </div>
      )}

      {/* Scope Selector Tabs for Admin / Manager */}
      {isAdminOrManager && (
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 mb-4 w-fit shadow-2xs">
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-1.5 text-xs rounded-lg font-medium transition-all ${
              viewMode === 'company'
                ? 'bg-white text-[#714B67] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setViewMode('company')}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Company Overview</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#714B67]/10 text-[#714B67]">
              {companyTotalRequests}
            </span>
          </button>
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-1.5 text-xs rounded-lg font-medium transition-all ${
              viewMode === 'mine'
                ? 'bg-white text-[#714B67] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setViewMode('mine')}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Time Off (Mine)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {myRequests.length}
            </span>
          </button>
        </div>
      )}

      {/* Metric Cards */}
      {isCompanyView ? (
        // Company-wide Metric Cards
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Total Submissions"
            value={`${companyTotalRequests} Requests`}
            subtitle="Company-wide submissions"
            icon={Plane}
          />
          <StatCard
            title="Pending Approvals"
            value={`${companyPending} Pending`}
            subtitle={companyPending > 0 ? 'Requires manager review' : 'All up to date'}
            icon={Clock}
            trend={companyPending > 0 ? 'Action needed' : undefined}
          />
          <StatCard
            title="Approved Leaves"
            value={`${companyApprovedCount} Approved`}
            subtitle="Authorized requests"
            icon={CheckCircle2}
          />
          <StatCard
            title="Total Days Utilized"
            value={`${companyDaysTaken} Days`}
            subtitle="Company-wide leave taken"
            icon={Calendar}
          />
        </div>
      ) : (
        // Personal Entitlement Cards
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Annual Paid Leave"
            value={annualTotal > 0 ? `${annualRemaining} / ${annualTotal} Days` : '—'}
            subtitle="Remaining annual entitlement"
            icon={Plane}
          />
          <StatCard
            title="Sick Leave"
            value={sickTotal > 0 ? `${sickRemaining} / ${sickTotal} Days` : '—'}
            subtitle="Remaining medical entitlement"
            icon={Calendar}
          />
          <StatCard
            title="My Pending"
            value={`${myPendingCount} Request${myPendingCount !== 1 ? 's' : ''}`}
            subtitle={myPendingCount > 0 ? 'Awaiting review' : 'No pending requests'}
            icon={Clock}
            trend={myPendingCount > 0 ? 'In review' : undefined}
          />
          <StatCard
            title="My Taken This Year"
            value={`${myUsedDays} Days`}
            subtitle="Personal days utilized"
            icon={CheckCircle2}
          />
        </div>
      )}

      {/* Requests Table */}
      <Card className="mt-4">
        <CardHeader
          title={isCompanyView ? 'All Employee Leave Requests' : 'My Leave Requests'}
          subtitle={
            isCompanyView
              ? 'Organization-wide history of time-off submissions and approval statuses.'
              : 'Your personal time-off applications, review states, and historical dates.'
          }
        />
        <DataTable
          columns={columns}
          data={currentRequests}
          isLoading={isRequestsLoading}
          emptyTitle="No time off requests"
          emptyDescription={
            isCompanyView
              ? 'No employee leave requests have been submitted yet.'
              : 'You have not submitted any personal time off requests yet. Click "Request Time Off" to apply.'
          }
        />
      </Card>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Apply for Time Off"
        description="Submit a new vacation, medical, or unpaid absence request for manager review."
      >
        <div className="space-y-4">
          <FormField label="Leave Type" required>
            <Select
              options={typeOptions.map((t) => ({ value: t, label: t }))}
              value={formData.type}
              onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Start Date" required>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </FormField>

            <FormField label="End Date" required>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Reason & Description">
            <textarea
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#714B67]"
              rows={3}
              placeholder="e.g. Annual family vacation or medical recovery appointment"
              value={formData.reason}
              onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={isEmployeeInactive ? 'secondary' : 'primary'}
              size="sm"
              isLoading={submitMutation.isPending}
              disabled={isEmployeeInactive || submitMutation.isPending}
              onClick={handleRequest}
            >
              Submit Application
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Leave Type Modal */}
      <Modal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        title="Configure New Time Off Type"
        description="Add a customizable leave policy category for the company"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsTypeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={createTypeMutation.isPending}
              onClick={() => {
                if (!newTypeData.name.trim()) {
                  toast.error('Please enter a leave type name.');
                  return;
                }
                createTypeMutation.mutate(newTypeData);
              }}
            >
              Create Leave Type
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <FormField label="Leave Type Name" required>
            <Input
              placeholder="e.g. Parental Leave, Compassionate Leave, Study Leave"
              value={newTypeData.name}
              onChange={(e) => setNewTypeData((prev) => ({ ...prev, name: e.target.value }))}
            />
          </FormField>

          <FormField label="Policy Description">
            <textarea
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#714B67]"
              rows={2}
              placeholder="Guidelines for eligibility and documentation"
              value={newTypeData.description}
              onChange={(e) => setNewTypeData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-[#714B67] focus:ring-[#714B67]"
                checked={newTypeData.paid}
                onChange={(e) => setNewTypeData((prev) => ({ ...prev, paid: e.target.checked }))}
              />
              <span className="font-medium text-slate-700">Paid Leave</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-[#714B67] focus:ring-[#714B67]"
                checked={newTypeData.requiresApproval}
                onChange={(e) => setNewTypeData((prev) => ({ ...prev, requiresApproval: e.target.checked }))}
              />
              <span className="font-medium text-slate-700">Requires Approval</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Assign Leave Allocation Modal */}
      <Modal
        isOpen={isAllocModalOpen}
        onClose={() => setIsAllocModalOpen(false)}
        title="Assign Leave Allocation"
        description="Credit authorized vacation/leave days to an employee's annual balance"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsAllocModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={createAllocMutation.isPending}
              onClick={() => {
                if (!newAllocData.employeeId || !newAllocData.timeOffTypeId || !newAllocData.allocatedDays) {
                  toast.error('Please select an employee, leave type, and specify allocated days.');
                  return;
                }
                createAllocMutation.mutate({
                  employeeId: newAllocData.employeeId,
                  timeOffTypeId: newAllocData.timeOffTypeId,
                  periodStart: newAllocData.periodStart,
                  periodEnd: newAllocData.periodEnd,
                  allocatedDays: Number(newAllocData.allocatedDays),
                });
              }}
            >
              Allocate Days
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <FormField label="Target Employee" required>
            <Select
              options={[
                { value: '', label: 'Select Employee...' },
                ...allEmployees.map((e) => ({
                  value: e.id,
                  label: `${e.firstName} ${e.lastName} (${e.employeeCode || e.email})`,
                })),
              ]}
              value={newAllocData.employeeId}
              onChange={(e) => setNewAllocData((prev) => ({ ...prev, employeeId: e.target.value }))}
            />
          </FormField>

          <FormField label="Leave Type" required>
            <Select
              options={[
                { value: '', label: 'Select Leave Type...' },
                ...leaveTypes.map((t) => ({
                  value: t.id,
                  label: `${t.name} ${t.paid ? '(Paid)' : '(Unpaid)'}`,
                })),
              ]}
              value={newAllocData.timeOffTypeId}
              onChange={(e) => setNewAllocData((prev) => ({ ...prev, timeOffTypeId: e.target.value }))}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Validity Start Date" required>
              <Input
                type="date"
                value={newAllocData.periodStart}
                onChange={(e) => setNewAllocData((prev) => ({ ...prev, periodStart: e.target.value }))}
              />
            </FormField>

            <FormField label="Validity End Date" required>
              <Input
                type="date"
                value={newAllocData.periodEnd}
                onChange={(e) => setNewAllocData((prev) => ({ ...prev, periodEnd: e.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Allocated Days Count" required>
            <Input
              type="number"
              min="0.5"
              step="0.5"
              placeholder="e.g. 15 or 24"
              value={newAllocData.allocatedDays}
              onChange={(e) => setNewAllocData((prev) => ({ ...prev, allocatedDays: e.target.value }))}
            />
          </FormField>
        </div>
      </Modal>
    </PageContainer>
  );
}
