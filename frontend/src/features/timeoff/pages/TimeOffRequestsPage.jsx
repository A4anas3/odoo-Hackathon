import React, { useState } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/table/DataTable';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { ConfirmModal } from '../../../components/modal/ConfirmModal';
import { timeoffApi } from '../api/timeoffApi';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { PERMISSIONS } from '../../../config/permissions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../hooks/useToast';
import { formatDate } from '../../../lib/utils/formatters';
import { Check, X, Plus, Users, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';

export function TimeOffRequestsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = useCurrentUser();
  const canApprove = can(PERMISSIONS.CAN_APPROVE_LEAVE);

  // If approver, allow switching between 'all' and 'mine'
  const [scope, setScope] = useState(canApprove ? 'all' : 'mine');
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionType, setActionType] = useState(null);

  const isCompanyScope = canApprove && scope === 'all';

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['timeoff', 'requests', 'queue', isCompanyScope],
    queryFn: () => (isCompanyScope ? timeoffApi.getAllRequests() : timeoffApi.getMyRequests()),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }) => timeoffApi.reviewRequest(id, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['timeoff'] });
      toast.success(`Leave request ${vars.status.toLowerCase()} successfully.`);
      setSelectedReq(null);
      setActionType(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to review leave request.');
    },
  });

  const handleAction = (req, type) => {
    setSelectedReq(req);
    setActionType(type);
  };

  const handleConfirm = () => {
    if (!selectedReq || !actionType) return;
    const newStatus = actionType === 'approve' ? 'APPROVED' : 'REJECTED';
    reviewMutation.mutate({ id: selectedReq.id, status: newStatus });
  };

  const columns = [
    ...(isCompanyScope
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
      header: 'Type',
      key: 'timeOffTypeName',
      render: (type, row) => <span className="font-medium text-slate-700">{type || row.type || 'Leave'}</span>,
    },
    {
      header: 'Dates',
      key: 'dates',
      render: (_, row) => (
        <span className="text-slate-600">
          {formatDate(row.startDate)} — {formatDate(row.endDate)}
        </span>
      ),
    },
    {
      header: 'Days',
      key: 'durationDays',
      render: (days, row) => {
        const d = days || row.duration || 1;
        return <span className="font-semibold text-slate-800">{d} {d === 1 ? 'day' : 'days'}</span>;
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
    ...(isCompanyScope
      ? [
          {
            header: 'Actions',
            key: 'actions',
            render: (_, row) =>
              row.status === 'PENDING' ? (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                    icon={Check}
                    onClick={() => handleAction(row, 'approve')}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                    icon={X}
                    onClick={() => handleAction(row, 'reject')}
                  >
                    Reject
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-medium">Decided</span>
              ),
          },
        ]
      : []),
  ];

  return (
    <PageContainer
      title={isCompanyScope ? 'Leave Approval Queue' : 'My Leave Requests'}
      description={
        isCompanyScope
          ? 'Review, approve, or reject employee time off applications across departments.'
          : 'Track the status and review decisions of your personal time off requests.'
      }
      actions={
        <Link to={ROUTES.TIMEOFF}>
          <Button variant="primary" size="sm" icon={Plus}>
            New Application
          </Button>
        </Link>
      }
    >
      {/* Scope Selector Tabs for Admin / Manager */}
      {canApprove && (
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 mb-4 w-fit shadow-2xs">
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-1.5 text-xs rounded-lg font-medium transition-all ${
              scope === 'all'
                ? 'bg-white text-[#714B67] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setScope('all')}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Company Requests</span>
          </button>
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-1.5 text-xs rounded-lg font-medium transition-all ${
              scope === 'mine'
                ? 'bg-white text-[#714B67] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setScope('mine')}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Requests (Mine)</span>
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={requests}
        isLoading={isLoading}
        emptyTitle="No leave requests"
        emptyDescription={
          isCompanyScope
            ? 'No leave requests are currently pending review.'
            : 'You have not submitted any time off requests yet.'
        }
      />

      <ConfirmModal
        isOpen={!!selectedReq}
        onClose={() => {
          setSelectedReq(null);
          setActionType(null);
        }}
        onConfirm={handleConfirm}
        title={actionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
        message={
          actionType === 'approve'
            ? 'Are you sure you want to approve this time off request? The employee will be marked on leave.'
            : 'Are you sure you want to reject this request? The allocation balance will remain credited to the employee.'
        }
        confirmVariant={actionType === 'approve' ? 'primary' : 'danger'}
        confirmLabel={actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
      />
    </PageContainer>
  );
}
