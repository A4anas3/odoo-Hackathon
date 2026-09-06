import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { StatusBadge } from '@/components/badge/StatusBadge';
import { Button } from '@/components/ui/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payslipApi } from '../api/payslipApi';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/config/routes';
import {
  ArrowLeft,
  Calculator,
  CreditCard,
  Printer,
  FileDown,
  Info,
  Layers,
  Calendar,
  User,
  Clock,
} from 'lucide-react';
import { Spinner } from '@/components/loading/Spinner';

export function PayslipDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [isDownloading, setIsDownloading] = useState(false);

  const { data: payslip, isLoading } = useQuery({
    queryKey: ['payroll', 'payslip', id],
    queryFn: () => payslipApi.getPayslipById(id),
  });

  // Recompute single payslip mutation
  const computeMutation = useMutation({
    mutationFn: () => payslipApi.computePayslip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'payslip', id] });
      queryClient.invalidateQueries({ queryKey: ['payroll', 'payslips'] });
      toast.success('Payslip salary computation evaluated against latest salary rules.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to recompute payslip.');
    },
  });

  // Mark single payslip paid
  const payMutation = useMutation({
    mutationFn: () => payslipApi.payPayslip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'payslip', id] });
      queryClient.invalidateQueries({ queryKey: ['payroll', 'payslips'] });
      toast.success('Payslip marked as PAID.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to mark as paid.');
    },
  });

  // Print/Download PDF
  const handlePrintPdf = async () => {
    if (!payslip?.id) return;
    setIsDownloading(true);
    try {
      const blob = await payslipApi.downloadPayslipPdf(payslip.id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${payslip.slipNumber || payslip.id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`PDF for ${payslip.slipNumber || 'payslip'} generated and downloaded.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to download PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Payslip Details">
        <div className="py-24 flex justify-center">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (!payslip) {
    return (
      <PageContainer title="Payslip Details">
        <div className="py-16 text-center text-slate-500">
          <p className="font-semibold text-sm">Payslip record not found.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate(ROUTES.PAYSLIPS)}>
            Back to Payslips
          </Button>
        </div>
      </PageContainer>
    );
  }

  const empName = payslip.employeeName || 'Employee';
  const payrunName = payslip.payrunName || 'February 2026';
  const structureName = payslip.salaryStructureName || 'Regular Salary';
  const periodLabel = payslip.periodStart && payslip.periodEnd
    ? `${formatDate(payslip.periodStart)} – ${formatDate(payslip.periodEnd)}`
    : '01 Feb – 28 Feb';
  const workedDays = payslip.workedDays ?? 20;
  const status = payslip.status || 'DRAFT';

  // Compute calculated net pay: netSalary directly from payslip, or gross - totalDeductions
  const computedNetSalary = payslip.netSalary != null
    ? Number(payslip.netSalary)
    : (payslip.grossSalary != null && payslip.totalDeductions != null
        ? Math.max(0, Number(payslip.grossSalary) - Number(payslip.totalDeductions))
        : null);

  // Extract lines for Salary Computation table
  const rawLines = Array.isArray(payslip.lines) ? payslip.lines : [];

  // Calculate sum of deductions from lines if totalDeductions is missing
  const totalDeductionsFromLines = rawLines
    .filter((l) => {
      const cat = (l.category || '').toUpperCase();
      return cat === 'DED' || cat === 'DEDUCTION' || cat === 'TAX';
    })
    .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  const grossFromLines = rawLines
    .filter((l) => (l.category || '').toUpperCase() === 'GROSS' || (l.ruleCode || '').toUpperCase() === 'GROSS')
    .map((l) => Number(l.amount))
    .find((a) => !isNaN(a) && a > 0) ?? Number(payslip.grossSalary || 0);

  const effectiveNetSalary = computedNetSalary != null
    ? computedNetSalary
    : (grossFromLines > 0 ? Math.max(0, grossFromLines - totalDeductionsFromLines) : null);

  // Ensure NET row reflects actual Net Pay (Gross minus Deductions), never unadjusted Gross Pay
  const lines = rawLines.map((line) => {
    const cat = (line.category || '').toUpperCase();
    const code = (line.ruleCode || line.code || '').toUpperCase();
    const isNet = cat === 'NET' || code === 'NET';
    if (isNet && effectiveNetSalary != null) {
      return {
        ...line,
        amount: effectiveNetSalary,
      };
    }
    return line;
  });

  return (
    <PageContainer
      title={`Payslip / ${empName} / ${payrunName}`}
      description="Detailed salary computation for one employee."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.PAYSLIPS)}>
            Back
          </Button>

          {status !== 'PAID' && (
            <Button
              variant="primary"
              size="sm"
              icon={Calculator}
              isLoading={computeMutation.isPending}
              onClick={() => computeMutation.mutate()}
            >
              COMPUTE
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
              MARK PAID
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            icon={Printer}
            isLoading={isDownloading}
            onClick={handlePrintPdf}
          >
            PRINT PAYSLIP
          </Button>
        </div>
      }
    >
      {/* Payslip Header Fields Grid (Matches Wireframe 4 Form View) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Employee</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#714B67]" />
              {empName}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Salary Structure</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#714B67]" />
              {structureName}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Pay Run</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
              {payrunName}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Period</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#714B67]" />
              {periodLabel}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Status</span>
            <div className="mt-1">
              <StatusBadge status={status} />
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Worked Days</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-[#714B67]" />
              {workedDays}
            </span>
          </div>
        </div>
      </div>

      {/* Salary Computation Table (Matches Wireframe 4) */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Salary Computation
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {payslip.slipNumber || `SLIP-${payslip.id.slice(0, 8).toUpperCase()}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Rule</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 font-mono text-right">Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line, idx) => {
                const cat = (line.category || '').toUpperCase();
                const isNet = cat === 'NET';
                const isGross = cat === 'GROSS';
                const isDed = cat === 'DED' || cat === 'DEDUCTION' || cat === 'TAX';

                return (
                  <tr
                    key={line.id || idx}
                    className={`transition-colors ${isNet ? 'bg-[#714B67]/5 font-bold' : isGross ? 'bg-slate-50 font-semibold' : 'hover:bg-slate-50/70'}`}
                  >
                    <td className="p-3">
                      <span className={`block leading-tight ${isNet ? 'text-[#714B67] text-sm' : 'text-slate-900'}`}>
                        {line.ruleName || line.name}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          isNet
                            ? 'bg-[#714B67]/10 text-[#714B67] border-[#714B67]/30'
                            : isDed
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isGross
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {line.category}
                      </span>
                    </td>
                    <td className={`p-3 text-right font-mono ${isNet ? 'text-[#714B67] text-base' : isDed ? 'text-rose-600' : 'text-slate-900'}`}>
                      {isDed ? '-' : ''}{formatCurrency(line.amount)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500 font-semibold">
                      {line.ruleCode || line.code}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
