import React, { useState } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/table/DataTable';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { ConfirmModal } from '../../../components/modal/ConfirmModal';
import { timeoffApi, DEFAULT_LEAVE_REQUESTS } from '../api/timeoffApi';
import { useToast } from '../../../hooks/useToast';
import { formatDate } from '../../../lib/utils/formatters';
import { Check, X } from 'lucide-react';

export function TimeOffRequestsPage() {
  const toast = useToast();
  const [requests, setRequests] = useState(DEFAULT_LEAVE_REQUESTS);
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionType, setActionType] = useState(null);

  const handleAction = (req, type) => {
    setSelectedReq(req);
    setActionType(type);
  };

  const handleConfirm = async () => {
    if (!selectedReq || !actionType) return;
    const newStatus = actionType === 'approve' ? 'APPROVED' : 'REJECTED';
    await timeoffApi.reviewRequest(selectedReq.id, newStatus);
    setRequests((prev) =>
      prev.map((r) => (r.id === selectedReq.id ? { ...r, status: newStatus } : r))
    );
    toast.success(`Leave request ${newStatus.toLowerCase()} successfully.`);
    setSelectedReq(null);
    setActionType(null);
  };

  const columns = [
    {
      header: 'Employee',
      key: 'employee',
      render: (emp) => (
        <div>
          <span className="font-semibold text-slate-800 block leading-tight">{emp?.name}</span>
          <span className="text-[10px] text-slate-400">{emp?.department}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      key: 'type',
      render: (type) => <span className="font-medium text-slate-700">{type}</span>,
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
      header: 'Duration',
      key: 'durationDays',
      render: (d) => <span className="font-semibold text-slate-800">{d} days</span>,
    },
    {
      header: 'Reason',
      key: 'reason',
      render: (r) => <span className="text-slate-500 italic max-w-xs truncate block">{r || '—'}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (s) => <StatusBadge status={s} />,
    },
    {
      header: 'Review Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => {
        if (row.status !== 'PENDING') {
          return <span className="text-[11px] text-slate-400 italic">Resolved</span>;
        }
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="success"
              size="xs"
              icon={Check}
              onClick={() => handleAction(row, 'approve')}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="xs"
              icon={X}
              onClick={() => handleAction(row, 'reject')}
            >
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <PageContainer
      title="Leave Approval Queue"
      description="Review, approve, or reject employee leave requests and time off submissions."
    >
      <DataTable
        columns={columns}
        data={requests}
        emptyTitle="No leave applications"
        emptyDescription="All leave requests have been reviewed."
      />

      <ConfirmModal
        isOpen={Boolean(selectedReq)}
        onClose={() => setSelectedReq(null)}
        onConfirm={handleConfirm}
        type={actionType === 'approve' ? 'success' : 'danger'}
        title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Leave Request`}
        message={`Are you sure you want to ${actionType} the ${selectedReq?.type} request for ${selectedReq?.employee?.name}?`}
        confirmText={actionType === 'approve' ? 'Approve Leave' : 'Reject Leave'}
      />
    </PageContainer>
  );
}
