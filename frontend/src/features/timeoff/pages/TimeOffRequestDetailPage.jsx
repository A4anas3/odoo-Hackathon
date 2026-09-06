import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeoffApi } from '../api/timeoffApi';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { PERMISSIONS } from '../../../config/permissions';
import { ROUTES } from '../../../config/routes';
import { useToast } from '../../../hooks/useToast';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Avatar } from '../../../components/ui/Avatar';
import { Modal } from '../../../components/modal/Modal';
import { FormField } from '../../../components/form/FormField';
import { Input } from '../../../components/form/Input';
import { formatDate } from '../../../lib/utils/formatters';
import { 
  ArrowLeft, Check, X, Info, Calendar, Clock, 
  AlertCircle, ShieldCheck, CheckCircle2 
} from 'lucide-react';

export function TimeOffRequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = useCurrentUser();
  const canApprove = can(PERMISSIONS.CAN_APPROVE_LEAVE);

  // Refusal Modal State
  const [isRefuseModalOpen, setIsRefuseModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch request record from real API
  const { data: request, isLoading, isError, error } = useQuery({
    queryKey: ['timeoff', 'request', id],
    queryFn: () => timeoffApi.getRequestById(id),
    enabled: !!id,
  });

  // Mutation to approve/refuse
  const reviewMutation = useMutation({
    mutationFn: ({ status, reason }) => timeoffApi.reviewRequest(id, status, reason),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['timeoff'] });
      toast.success(`Request ${vars.status === 'APPROVED' ? 'approved' : 'refused'} successfully.`);
      setIsRefuseModalOpen(false);
      setRejectionReason('');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to review time off request.');
    },
  });

  const handleApprove = () => {
    reviewMutation.mutate({ status: 'APPROVED', reason: '' });
  };

  const handleRefuseConfirm = () => {
    reviewMutation.mutate({ status: 'REJECTED', reason: rejectionReason });
  };

  if (isLoading) {
    return (
      <PageContainer title="Time Off Request" description="Loading request details...">
        <div className="flex items-center justify-center py-20">
          <Clock className="w-8 h-8 text-[#714B67] animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !request) {
    return (
      <PageContainer title="Time Off Request" description="Request not found">
        <div className="max-w-md mx-auto py-12 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Request Not Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {error?.response?.data?.message || 'The requested time off record could not be found.'}
          </p>
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.TIMEOFF_REQUESTS)}>
            Back to Requests
          </Button>
        </div>
      </PageContainer>
    );
  }

  const employeeName = request.employeeName || 'Employee';
  const headerTitle = `Time Off Request / ${employeeName}`;
  const isPending = request.status === 'PENDING';

  return (
    <PageContainer
      title={headerTitle}
      description="Form view of one request"
      breadcrumbs={[
        { label: 'Time Off', href: ROUTES.TIMEOFF },
        { label: 'Requests', href: ROUTES.TIMEOFF_REQUESTS },
        { label: employeeName },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate(ROUTES.TIMEOFF_REQUESTS)}
          >
            Back
          </Button>

          {canApprove && isPending && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={Check}
                isLoading={reviewMutation.isPending}
                onClick={handleApprove}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={X}
                disabled={reviewMutation.isPending}
                onClick={() => setIsRefuseModalOpen(true)}
              >
                Refuse
              </Button>
            </>
          )}
        </div>
      }
    >
      {/* Main Request Form Card matching Wireframe 2 */}
      <Card className="border border-slate-200 shadow-sm max-w-5xl mx-auto">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header Info Banner */}
          <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={employeeName} size="md" />
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  {employeeName}
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  {request.timeOffTypeName || 'Leave Request'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Status:</span>
              <StatusBadge status={request.status} label={isPending ? 'To Approve' : request.status} />
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Left Column */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Employee
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 flex items-center justify-between">
                  <span>{employeeName}</span>
                  {request.employeeId && (
                    <Link
                      to={`/employees/${request.employeeId}`}
                      className="text-[#714B67] hover:underline font-semibold text-[11px]"
                    >
                      View Profile
                    </Link>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Time Off Type
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800">
                  {request.timeOffTypeName || 'Paid Time Off'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Start Date
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-800">
                  {request.startDate ? formatDate(request.startDate) : '—'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  End Date
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-800">
                  {request.endDate ? formatDate(request.endDate) : '—'}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Duration
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 font-mono">
                  {request.duration != null ? `${Number(request.duration).toFixed(0)} Days` : '1 Day'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Status
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800">
                  <StatusBadge status={request.status} label={isPending ? 'To Approve' : request.status} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Approver
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800">
                  {request.approvedByName || 'Pending Review'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Allocation Used
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-blue-700 font-mono">
                  {request.allocationUsedName || `${request.timeOffTypeName || 'Leave'} 2026`}
                </div>
              </div>
            </div>
          </div>

          {/* Full Width Reason */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reason
            </label>
            <div className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed min-h-[50px]">
              {request.reason || 'No specific reason provided by employee.'}
            </div>
          </div>

          {request.rejectionReason && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <strong>Refusal Reason:</strong> {request.rejectionReason}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Useful Note Footer matching wireframe specification */}
      <div className="max-w-5xl mx-auto mt-4 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-center gap-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-medium leading-relaxed">
          <strong>Useful note:</strong> if the selected type requires allocation, the request should clearly show which balance was consumed.
        </span>
      </div>

      {/* Refuse Modal */}
      <Modal
        isOpen={isRefuseModalOpen}
        onClose={() => setIsRefuseModalOpen(false)}
        title="Refuse Time Off Request"
        description={`Provide a reason for refusing ${employeeName}'s leave request.`}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsRefuseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={reviewMutation.isPending}
              onClick={handleRefuseConfirm}
            >
              Confirm Refusal
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <FormField label="Refusal Reason">
            <Input
              placeholder="e.g. Inadequate team shift coverage during sprint release..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>
    </PageContainer>
  );
}
