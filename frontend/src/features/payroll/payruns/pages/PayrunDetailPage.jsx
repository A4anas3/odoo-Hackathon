import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/badge/StatusBadge';
import { Button } from '@/components/ui/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrunApi } from '../api/payrunApi';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ROUTES } from '@/config/routes';
import { useToast } from '@/hooks/useToast';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Send,
  AlertTriangle,
  FileText,
  Inbox,
  Users,
} from 'lucide-react';

export function PayrunDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [isSendingBulk, setIsSendingBulk] = useState(false);

  const { data: payrun = {}, isLoading } = useQuery({
    queryKey: ['payroll', 'payrun', id],
    queryFn: () => payrunApi.getPayrunById(id),
  });

  const validateMutation = useMutation({
    mutationFn: () => payrunApi.validatePayrun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'payrun', id] });
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      toast.success('Payrun validated successfully. Compliance checks passed.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Validation failed.');
    },
  });

  const payMutation = useMutation({
    mutationFn: () => payrunApi.payPayrun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'payrun', id] });
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      toast.success('Payrun marked as PAID. Payout recorded.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Payment update failed.');
    },
  });

  const handleSendBulkPayslips = async () => {
    setIsSendingBulk(true);
    try {
      const res = await payrunApi.sendPayslips(id);
      toast.success(res?.message || 'Queued bulk payslip emails via RabbitMQ.');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to dispatch payslips.');
    } finally {
      setIsSendingBulk(false);
    }
  };

  const enrolledPayslips = Array.isArray(payrun.payslips) ? payrun.payslips : [];
  const staffCount = enrolledPayslips.length || payrun.employeeCount || 0;
  const grossTotal = payrun.grossAmount ?? payrun.totalGross ?? 0;
  const deductionsTotal = payrun.deductionsAmount ?? payrun.totalDeductions ?? 0;
  const netTotal = payrun.netAmount ?? payrun.totalNet ?? 0;
  const warnings = Array.isArray(payrun.warnings) ? payrun.warnings : [];
  const status = payrun.status || 'DRAFT';

  return (
    <PageContainer
      title={payrun.name || 'Payrun Processing'}
      description={`Period: ${formatDate(payrun.periodStart)} – ${formatDate(payrun.periodEnd)} • Structure: ${payrun.salaryStructureName || 'Regular Salary'}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.PAYRUNS)}>
            Back
          </Button>

          {status === 'DRAFT' && (
            <Button
              variant="secondary"
              size="sm"
              icon={ShieldCheck}
              isLoading={validateMutation.isPending}
              onClick={() => validateMutation.mutate()}
            >
              Validate Batch
            </Button>
          )}

          {status !== 'PAID' && (
            <Button
              variant="success"
              size="sm"
              icon={CreditCard}
              isLoading={payMutation.isPending}
              onClick={() => payMutation.mutate()}
            >
              Mark as Paid
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            icon={Send}
            isLoading={isSendingBulk}
            onClick={handleSendBulkPayslips}
          >
            Send Payslips (Email & Queue)
          </Button>
        </div>
      }
    >
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Payrun Status</span>
          <div className="mt-1 flex justify-center">
            <StatusBadge status={status} />
          </div>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Enrolled</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">
            {staffCount} staff
          </span>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Gross Wage</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">
            {formatCurrency(grossTotal)}
          </span>
        </Card>
        <Card className="p-4 text-center bg-[#714B67]/5 border-[#714B67]/20">
          <span className="text-[10px] text-[#714B67] uppercase font-semibold block">Net Disbursed</span>
          <span className="text-xl font-bold text-[#714B67] mt-1 block">
            {formatCurrency(netTotal)}
          </span>
        </Card>
      </div>

      {/* Validation Warnings if any */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 space-y-1.5 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Pre-Disbursement Compliance Warnings ({warnings.length})
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-amber-700 pl-1">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Enrolled Payslips Table */}
      <Card>
        <CardHeader
          title="Enrolled Employees & Payslip Computations"
          subtitle={`Itemized salary calculation for ${staffCount} staff members.`}
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Bank Details</th>
                  <th className="p-3">Gross</th>
                  <th className="p-3 text-rose-600">Deductions</th>
                  <th className="p-3 font-bold">Net Pay</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrolledPayslips.length > 0 ? (
                  enrolledPayslips.map((slip) => {
                    const name = slip.employeeName || 'Staff';
                    const code = slip.employeeCode || '—';
                    const dept = slip.departmentName || '—';
                    const bank = slip.bankAccountNo ? `${slip.bankName || 'Bank'} (${slip.bankAccountNo.slice(-4)})` : 'Missing Bank';
                    const gross = slip.grossSalary ?? slip.grossAmount ?? 0;
                    const ded = slip.totalDeductions ?? slip.deductionsAmount ?? 0;
                    const net = slip.netSalary ?? slip.netAmount ?? 0;
                    return (
                      <tr
                        key={slip.id}
                        className="hover:bg-slate-50/70 cursor-pointer"
                        onClick={() => navigate(ROUTES.PAYSLIP_DETAIL(slip.id))}
                      >
                        <td className="p-3">
                          <span className="font-semibold text-slate-900 block">{name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{code}</span>
                        </td>
                        <td className="p-3 text-slate-500">{dept}</td>
                        <td className="p-3">
                          <span className={`text-[11px] font-mono ${slip.bankAccountNo ? 'text-slate-600' : 'text-amber-600 font-semibold'}`}>
                            {bank}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-900">{formatCurrency(gross)}</td>
                        <td className="p-3 text-rose-600 font-medium">-{formatCurrency(ded)}</td>
                        <td className="p-3 font-bold text-emerald-700">{formatCurrency(net)}</td>
                        <td className="p-3 text-center"><StatusBadge status={slip.status || status} /></td>
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={FileText}
                            onClick={() => navigate(ROUTES.PAYSLIP_DETAIL(slip.id))}
                          >
                            View Slip
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-1 stroke-1" />
                      No individual payslips enrolled for this payrun batch.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
