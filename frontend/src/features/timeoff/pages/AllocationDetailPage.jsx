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
import { 
  ArrowLeft, Check, X, Info, Clock, AlertCircle, Layers 
} from 'lucide-react';

export function AllocationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = useCurrentUser();
  const canManage = can(PERMISSIONS.CAN_APPROVE_LEAVE);

  const { data: allocation, isLoading, isError, error } = useQuery({
    queryKey: ['timeoff', 'allocation', id],
    queryFn: () => timeoffApi.getAllocationById(id),
    enabled: !!id,
  });

  const reviewMutation = useMutation({
    mutationFn: (status) => timeoffApi.reviewAllocation(id, status),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['timeoff'] });
      toast.success(`Allocation ${status === 'APPROVED' ? 'approved' : 'refused'} successfully.`);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to review allocation.');
    },
  });

  if (isLoading) {
    return (
      <PageContainer title="Allocation Record" description="Loading allocation details...">
        <div className="flex items-center justify-center py-20">
          <Clock className="w-8 h-8 text-[#714B67] animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !allocation) {
    return (
      <PageContainer title="Allocation Record" description="Allocation not found">
        <div className="max-w-md mx-auto py-12 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Allocation Not Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {error?.response?.data?.message || 'The requested allocation record could not be found.'}
          </p>
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.TIMEOFF_ALLOCATIONS)}>
            Back to Allocations
          </Button>
        </div>
      </PageContainer>
    );
  }

  const employeeName = allocation.employeeName || 'Employee';
  const headerTitle = `Allocation / ${employeeName}`;
  const isToApprove = allocation.status === 'TO_APPROVE';

  return (
    <PageContainer
      title={headerTitle}
      description="Form view of one allocation record"
      breadcrumbs={[
        { label: 'Time Off', href: ROUTES.TIMEOFF },
        { label: 'Allocations', href: ROUTES.TIMEOFF_ALLOCATIONS },
        { label: employeeName },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate(ROUTES.TIMEOFF_ALLOCATIONS)}
          >
            Back
          </Button>

          {canManage && isToApprove && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={Check}
                isLoading={reviewMutation.isPending}
                onClick={() => reviewMutation.mutate('APPROVED')}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={X}
                disabled={reviewMutation.isPending}
                onClick={() => reviewMutation.mutate('REFUSED')}
              >
                Refuse
              </Button>
            </>
          )}
        </div>
      }
    >
      {/* Main Allocation Form Card matching Wireframe 4 */}
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
                  {allocation.timeOffTypeName || 'Leave Allocation'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Status:</span>
              <StatusBadge status={allocation.status} label={isToApprove ? 'To Approve' : allocation.status} />
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
                  {allocation.employeeId && (
                    <Link
                      to={`/employees/${allocation.employeeId}`}
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
                  {allocation.timeOffTypeName || 'Paid Time Off'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Allocated
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 font-mono">
                  {allocation.allocatedDays != null ? `${Number(allocation.allocatedDays).toFixed(0)} Days` : '0 Days'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Status
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800">
                  <StatusBadge status={allocation.status} label={isToApprove ? 'To Approve' : allocation.status} />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Taken
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-700">
                  {allocation.usedDays != null ? `${Number(allocation.usedDays).toFixed(0)} Days` : '0 Days'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Remaining
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-emerald-700">
                  {allocation.remainingDays != null ? `${Number(allocation.remainingDays).toFixed(0)} Days` : '0 Days'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Approver
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800">
                  {allocation.approvedByName || 'HR Operations'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Validity
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-blue-700 font-mono">
                  {allocation.validity || '2026 Annual Balance'}
                </div>
              </div>
            </div>
          </div>

          {/* Full Width Description */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <div className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed min-h-[50px]">
              {allocation.description || 'Annual leave balance granted at start of policy year.'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Useful Note Footer matching wireframe specification */}
      <div className="max-w-5xl mx-auto mt-4 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-center gap-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-medium leading-relaxed">
          <strong>Useful note:</strong> approved allocation is what creates available leave balance for the employee.
        </span>
      </div>
    </PageContainer>
  );
}
