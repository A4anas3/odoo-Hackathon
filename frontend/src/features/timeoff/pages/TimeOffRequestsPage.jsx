import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/table/DataTable';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/form/Input';
import { Select } from '../../../components/form/Select';
import { Modal } from '../../../components/modal/Modal';
import { FormField } from '../../../components/form/FormField';
import { Avatar } from '../../../components/ui/Avatar';
import { timeoffApi } from '../api/timeoffApi';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { useMyProfile } from '../../employees/hooks/useEmployees';
import { PERMISSIONS } from '../../../config/permissions';
import { ROUTES } from '../../../config/routes';
import { useToast } from '../../../hooks/useToast';
import { formatDate } from '../../../lib/utils/formatters';
import { 
  Plus, Search, Users, UserCheck, Check, X, 
  Info, ChevronRight, AlertCircle, Calendar 
} from 'lucide-react';

export function TimeOffRequestsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = useCurrentUser();
  const canApprove = can(PERMISSIONS.CAN_APPROVE_LEAVE);
  const { data: profile } = useMyProfile();

  const [searchParams, setSearchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employeeId');

  // Scope: 'all' vs 'mine' vs 'team'
  const [scope, setScope] = useState(canApprove ? 'all' : 'mine');
  const isCompanyScope = canApprove && scope === 'all';

  // Search filter
  const [search, setSearch] = useState('');

  // New Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    timeOffTypeId: '',
    startDate: '',
    endDate: '',
    duration: '1.0',
    reason: '',
  });

  // Queries
  const { data: rawRequests = [], isLoading } = useQuery({
    queryKey: ['timeoff', 'requests', employeeIdParam || (isCompanyScope ? 'all' : 'mine')],
    queryFn: () => (isCompanyScope || employeeIdParam ? timeoffApi.getAllRequests() : timeoffApi.getMyRequests()),
  });

  const { data: types = [] } = useQuery({
    queryKey: ['timeoff', 'types'],
    queryFn: () => timeoffApi.getTypes(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload) => timeoffApi.submitRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff'] });
      toast.success('Time off request submitted successfully.');
      setIsModalOpen(false);
      setFormData({
        timeOffTypeId: '',
        startDate: '',
        endDate: '',
        duration: '1.0',
        reason: '',
      });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to submit time off request.');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }) => timeoffApi.reviewRequest(id, status, rejectionReason),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['timeoff'] });
      toast.success(`Request ${vars.status === 'APPROVED' ? 'approved' : 'refused'} successfully.`);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to review request.');
    },
  });

  // Handle Quick Approve / Refuse on list row
  const handleQuickReview = (e, req, status) => {
    e.stopPropagation(); // Don't trigger row click
    reviewMutation.mutate({
      id: req.id,
      status,
      rejectionReason: status === 'REJECTED' ? 'Refused by manager from requests list' : '',
    });
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    return rawRequests.filter((req) => {
      if (employeeIdParam && req.employeeId !== employeeIdParam) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const emp = (req.employeeName || '').toLowerCase();
        const type = (req.timeOffTypeName || '').toLowerCase();
        const status = (req.status || '').toLowerCase();
        if (!emp.includes(query) && !type.includes(query) && !status.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [rawRequests, employeeIdParam, search]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.timeOffTypeId || !formData.startDate || !formData.endDate) {
      toast.error('Please select a leave type and date range.');
      return;
    }
    createMutation.mutate({
      timeOffTypeId: formData.timeOffTypeId,
      startDate: formData.startDate,
      endDate: formData.endDate,
      duration: parseFloat(formData.duration) || 1.0,
      reason: formData.reason,
    });
  };

  // Table Columns matching Wireframe 1:
  // Employee, Type, Start, End, Duration, Status, Actions
  const columns = [
    {
      header: 'Employee',
      key: 'employee',
      render: (_, row) => {
        const name = row.employeeName || 'Staff Member';
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={name} size="sm" />
            <span className="font-semibold text-slate-800 block leading-tight">{name}</span>
          </div>
        );
      },
    },
    {
      header: 'Type',
      key: 'timeOffTypeName',
      render: (type) => <span className="font-medium text-slate-700">{type || 'Time Off'}</span>,
    },
    {
      header: 'Start',
      key: 'startDate',
      render: (date) => <span className="font-mono text-slate-700">{formatDate(date)}</span>,
    },
    {
      header: 'End',
      key: 'endDate',
      render: (date) => <span className="font-mono text-slate-700">{formatDate(date)}</span>,
    },
    {
      header: 'Duration',
      key: 'duration',
      render: (dur) => (
        <span className="font-semibold text-slate-900 font-mono">
          {dur != null ? `${Number(dur).toFixed(0)} Days` : '1 Day'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (status) => {
        const displayStatus = status === 'PENDING' ? 'To Approve' : status;
        return <StatusBadge status={status || 'PENDING'} label={displayStatus} />;
      },
    },
    ...(canApprove
      ? [
          {
            header: 'Actions',
            key: 'actions',
            align: 'right',
            render: (_, row) => {
              if (row.status !== 'PENDING') return null;
              return (
                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => handleQuickReview(e, row, 'APPROVED')}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-md transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                    title="Approve Request"
                  >
                    <Check className="w-3 h-3" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleQuickReview(e, row, 'REJECTED')}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] rounded-md transition-colors cursor-pointer flex items-center gap-1"
                    title="Refuse Request"
                  >
                    <X className="w-3 h-3" />
                    <span>Refuse</span>
                  </button>
                </div>
              );
            },
          },
        ]
      : []),
    {
      header: '',
      key: 'chevron',
      align: 'right',
      render: () => <ChevronRight className="w-4 h-4 text-slate-400 inline" />,
    },
  ];

  return (
    <PageContainer
      title="Time Off Requests"
      description="List view opened from Time Off v -> Requests"
      breadcrumbs={[
        { label: 'Time Off', href: ROUTES.TIMEOFF },
        { label: 'Requests' },
      ]}
    >
      {/* Employee Filter Banner when navigated via smart button */}
      {employeeIdParam && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-2xs mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>
              Filtered by Employee:{' '}
              <strong className="font-semibold">
                {filteredRequests[0]?.employeeName || 'Selected Employee'}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              searchParams.delete('employeeId');
              setSearchParams(searchParams);
            }}
            className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-semibold px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filter</span>
          </button>
        </div>
      )}

      {/* Filter Bar matching Wireframe 1: [NEW] [Search requests...] [My Team] */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* NEW Button */}
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
          >
            NEW
          </Button>

          {/* Search requests... input */}
          <div className="w-64 max-w-full">
            <Input
              placeholder="Search requests..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Scope Toggle: My Team / All */}
          {canApprove && (
            <button
              type="button"
              onClick={() => setScope(scope === 'all' ? 'mine' : 'all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                scope === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{scope === 'all' ? 'All Company' : 'My Team'}</span>
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Requests Table - Click row navigates to Form View */}
      <DataTable
        columns={columns}
        data={filteredRequests}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/time-off/requests/${row.id}`)}
        emptyTitle="No time off requests"
        emptyDescription="No leave requests match your current search or filter criteria."
      />

      {/* Useful Note Footer matching wireframe specification */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-center gap-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-medium leading-relaxed">
          <strong>Useful note:</strong> request status should show the approval lifecycle clearly.
        </span>
      </div>

      {/* NEW Request Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Time Off Request"
        description="Submit a planned absence or medical leave for review."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={createMutation.isPending}
              onClick={handleCreateSubmit}
            >
              Submit Request
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <FormField label="Time Off Type" required>
            <Select
              placeholder="Select leave type..."
              options={types.map((t) => ({ value: t.id, label: t.name }))}
              value={formData.timeOffTypeId}
              onChange={(e) => setFormData({ ...formData, timeOffTypeId: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Start Date" required>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </FormField>

            <FormField label="End Date" required>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Duration (Days)" required>
            <Input
              type="number"
              step="0.5"
              min="0.5"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            />
          </FormField>

          <FormField label="Reason / Notes">
            <textarea
              rows={2}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Family vacation or medical appointment..."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#714B67] focus:border-[#714B67]"
            />
          </FormField>
        </form>
      </Modal>
    </PageContainer>
  );
}
