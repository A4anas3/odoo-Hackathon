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
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { PERMISSIONS } from '../../../config/permissions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../hooks/useToast';
import { Calendar, Plus, CheckCircle2, Clock, CalendarDays, Plane, Users, UserCheck } from 'lucide-react';
import { formatDate } from '../../../lib/utils/formatters';

export function TimeOffPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = useCurrentUser();
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

  // Query Personal Allocations
  const { data: myAllocations = [], isLoading: isAllocationsLoading } = useQuery({
    queryKey: ['timeoff', 'allocations', 'my'],
    queryFn: () => timeoffApi.getMyAllocations(),
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

  const handleRequest = () => {
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
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Request Time Off
        </Button>
      }
    >
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
              variant="primary"
              size="sm"
              isLoading={submitMutation.isPending}
              onClick={handleRequest}
            >
              Submit Application
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
