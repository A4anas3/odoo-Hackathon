import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { StatusBadge } from '@/components/badge/StatusBadge';
import { Button } from '@/components/ui/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrunApi } from '../api/payrunApi';
import { payslipApi } from '@/features/payroll/payslips/api/payslipApi';
import { Checkbox } from '@/components/form/Checkbox';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ROUTES } from '@/config/routes';
import { useToast } from '@/hooks/useToast';
import {
  ArrowLeft,
  Calculator,
  ShieldCheck,
  CreditCard,
  Send,
  AlertTriangle,
  FileDown,
  Info,
  Layers,
  Calendar,
  Eye,
} from 'lucide-react';

export function PayrunDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [downloadingSlipId, setDownloadingSlipId] = useState(null);

  const { data: payrun = {}, isLoading } = useQuery({
    queryKey: ['payroll', 'payrun', id],
    queryFn: () => payrunApi.getPayrunById(id),
  });

  // Recompute Payrun Mutation
  const computeMutation = useMutation({
    mutationFn: () => payrunApi.computePayrun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'payrun', id] });
      queryClient.invalidateQueries({ queryKey: ['payroll', 'payruns'] });
      toast.success('Payrun and all enrolled payslips recomputed successfully.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Computation failed.');
    },
  });

  // Validate Payrun Mutation
  const validateMutation = useMutation({
    mutationFn: () => payrunApi.validatePayrun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'payrun', id] });
      queryClient.invalidateQueries({ queryKey: ['payroll', 'payruns'] });
      toast.success('Payrun validated successfully.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Validation failed.');
    },
  });

  // Mark Paid Mutation
  const payMutation = useMutation({
    mutationFn: () => payrunApi.payPayrun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'payrun', id] });
      queryClient.invalidateQueries({ queryKey: ['payroll', 'payruns'] });
      toast.success('Payrun marked as PAID.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to mark as paid.');
    },
  });

  // Send Payslips Bulk Action
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

  // Download Single Slip PDF
  const handleDownloadPdf = async (e, slipId, slipNum) => {
    e.stopPropagation();
    setDownloadingSlipId(slipId);
    try {
      const blob = await payslipApi.downloadPayslipPdf(slipId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${slipNum || slipId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully.');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to download PDF.');
    } finally {
      setDownloadingSlipId(null);
    }
  };

  const status = payrun.status || 'DRAFT';
  const payslips = Array.isArray(payrun.payslips) ? payrun.payslips : [];
  const warnings = Array.isArray(payrun.warnings) ? payrun.warnings : [];
  const periodLabel = payrun.periodStart && payrun.periodEnd
    ? `${formatDate(payrun.periodStart)} – ${formatDate(payrun.periodEnd)}`
    : '—';

  const [selectedSlipIds, setSelectedSlipIds] = useState([]);

  const toggleSelectAllSlips = () => {
    if (selectedSlipIds.length === payslips.length) {
      setSelectedSlipIds([]);
    } else {
      setSelectedSlipIds(payslips.map((s) => s.id));
    }
  };

  const toggleSelectSlip = (slipId) => {
    setSelectedSlipIds((prev) =>
      prev.includes(slipId) ? prev.filter((id) => id !== slipId) : [...prev, slipId]
    );
  };

  const selectedSlips = payslips.filter((s) => selectedSlipIds.includes(s.id));
  const activeSlips = selectedSlipIds.length > 0 ? selectedSlips : payslips;

  const totalBasic = activeSlips.reduce((sum, s) => sum + Number(s.basicSalary ?? s.grossSalary ?? 0), 0);
  const totalGross = activeSlips.reduce((sum, s) => sum + Number(s.grossSalary ?? 0), 0);
  const totalDeductions = activeSlips.reduce((sum, s) => sum + Number(s.totalDeductions ?? 0), 0);
  const totalAllowances = Math.max(0, totalGross - totalBasic);
  const totalNet = activeSlips.reduce((sum, s) => sum + Number(s.netSalary ?? (s.grossSalary - s.totalDeductions) ?? 0), 0);

  return (
    <PageContainer
      title={`Payrun / ${payrun.name || 'Batch Processing'}`}
      description="Review payrun lifecycle for company and manage its payslips."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.PAYRUNS)}>
            Back
          </Button>

          {status === 'DRAFT' && (
            <Button
              variant="primary"
              size="sm"
              icon={ShieldCheck}
              isLoading={validateMutation.isPending}
              onClick={() => validateMutation.mutate()}
            >
              COMPUTE & VALIDATE
            </Button>
          )}

          {(status === 'VALIDATED' || status === 'CONFIRMED') && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={Calculator}
                isLoading={validateMutation.isPending}
                onClick={() => validateMutation.mutate()}
                title="Recalculate attendance punches and salary rules"
              >
                RE-COMPUTE
              </Button>
              <Button
                variant="success"
                size="sm"
                icon={CreditCard}
                isLoading={payMutation.isPending}
                onClick={() => payMutation.mutate()}
              >
                MARK PAID
              </Button>
            </>
          )}

          {status === 'PAID' && (
            <Button
              variant="primary"
              size="sm"
              icon={Send}
              isLoading={isSendingBulk}
              onClick={handleSendBulkPayslips}
            >
              SEND PAYSLIPS
            </Button>
          )}
        </div>
      }
    >
      {/* Form Fields Card (Matches Wireframe 4 Form View) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Name</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">
              {payrun.name || 'February 2026'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Salary Structure</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#714B67]" />
              {payrun.salaryStructureName || 'Regular Salary'}
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
        </div>
      </div>

      {/* Compliance Warnings Banner */}
      {warnings.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Pre-Disbursement Validation Warnings ({warnings.length})</span>
          </div>
          <div className="space-y-1.5">
            {warnings.map((w, idx) => {
              const match = String(w).match(/^\[(.*?)\]\s*(.*)$/);
              const tag = match ? match[1] : null;
              const detail = match ? match[2] : w;

              return (
                <div
                  key={idx}
                  className="flex items-start gap-2 bg-white/80 border border-amber-200/60 rounded-lg p-2.5 text-xs text-slate-800"
                >
                  {tag && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                      {tag}
                    </span>
                  )}
                  <span className="flex-1 font-medium">{detail}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payslips in this Payrun Table (Matches Wireframe 4) */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Payslips in this Payrun ({payslips.length})
            </h3>
            {selectedSlipIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 px-3 py-1 rounded-lg bg-[#714B67]/10 border border-[#714B67]/20 text-[#714B67] text-xs font-bold">
                <span>Selected: {selectedSlipIds.length} / {payslips.length}</span>
                <span className="text-slate-300">|</span>
                <span>Basic: {formatCurrency(totalBasic, 'INR')}</span>
                <span className="text-slate-300">|</span>
                <span className="text-emerald-700">Allowances: +{formatCurrency(totalAllowances, 'INR')}</span>
                <span className="text-slate-300">|</span>
                <span className="text-rose-700">Deductions: -{formatCurrency(totalDeductions, 'INR')}</span>
                <span className="text-slate-300">|</span>
                <span className="text-emerald-800 font-extrabold">Net: {formatCurrency(totalNet, 'INR')}</span>
              </div>
            )}
          </div>
          <span className="text-xs text-slate-400">Click any row to open the full Payslip Form View</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-10 text-center">
                  <Checkbox
                    checked={selectedSlipIds.length === payslips.length && payslips.length > 0}
                    onChange={toggleSelectAllSlips}
                  />
                </th>
                <th className="p-3">Employee</th>
                <th className="p-3">Working</th>
                <th className="p-3">Standard</th>
                <th className="p-3">Basic</th>
                <th className="p-3">Allowances</th>
                <th className="p-3">Deductions</th>
                <th className="p-3">Net</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payslips.length > 0 ? (
                payslips.map((slip) => {
                  const basic = slip.basicSalary ?? slip.grossSalary ?? 0;
                  const gross = slip.grossSalary ?? 0;
                  const deductions = slip.totalDeductions ?? 0;
                  const allowances = Math.max(0, gross - basic);
                  const net = slip.netSalary ?? (gross - deductions);
                  const workingDays = slip.workedDays ?? 20;
                  const standardDays = slip.standardDays ?? 22;
                  const isChecked = selectedSlipIds.includes(slip.id);

                  return (
                    <tr
                      key={slip.id}
                      onClick={() => navigate(ROUTES.PAYSLIP_DETAIL(slip.id))}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${isChecked ? 'bg-[#714B67]/5' : ''}`}
                    >
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isChecked}
                          onChange={() => toggleSelectSlip(slip.id)}
                        />
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-900 block leading-tight">{slip.employeeName || 'Employee'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{slip.employeeCode || '—'}</span>
                      </td>
                      <td className="p-3 text-slate-600 font-mono">{workingDays} days</td>
                      <td className="p-3 text-slate-600 font-mono">{standardDays} days</td>
                      <td className="p-3 font-medium text-slate-800">{formatCurrency(basic, 'INR')}</td>
                      <td className="p-3 font-medium text-emerald-600">+{formatCurrency(allowances, 'INR')}</td>
                      <td className="p-3 font-medium text-rose-600">-{formatCurrency(deductions, 'INR')}</td>
                      <td className="p-3 font-bold text-slate-900">{formatCurrency(net, 'INR')}</td>
                      <td className="p-3 text-center">
                        <StatusBadge status={slip.status || status} />
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="xs"
                          title="Download PDF"
                          isLoading={downloadingSlipId === slip.id}
                          onClick={(e) => handleDownloadPdf(e, slip.id, slip.slipNumber)}
                        >
                          <FileDown className="w-4 h-4 text-[#714B67]" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No payslips in this payrun batch. Click "COMPUTE" above to evaluate salary rules.
                  </td>
                </tr>
              )}
            </tbody>
            {payslips.length > 0 && (
              <tfoot className="bg-slate-50 font-semibold text-slate-800 border-t-2 border-slate-200 sticky bottom-0 z-10 shadow-xs">
                <tr>
                  <td className="p-3 text-center font-mono text-[10px] text-slate-400">
                    {selectedSlipIds.length > 0 ? 'SEL' : 'TOTAL'}
                  </td>
                  <td className="p-3 font-bold text-slate-900">
                    {selectedSlipIds.length > 0
                      ? `Selected (${selectedSlipIds.length} of ${payslips.length})`
                      : `Batch Total (${payslips.length} payslips)`}
                  </td>
                  <td className="p-3 font-mono text-slate-400">—</td>
                  <td className="p-3 font-mono text-slate-400">—</td>
                  <td className="p-3 font-bold text-slate-800">{formatCurrency(totalBasic, 'INR')}</td>
                  <td className="p-3 font-bold text-emerald-700">+{formatCurrency(totalAllowances, 'INR')}</td>
                  <td className="p-3 font-bold text-rose-700">-{formatCurrency(totalDeductions, 'INR')}</td>
                  <td className="p-3 font-extrabold text-[#714B67] text-sm">{formatCurrency(totalNet, 'INR')}</td>
                  <td className="p-3" colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Floating Bottom Total Dock when records are selected */}
      {selectedSlipIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold">{selectedSlipIds.length} of {payslips.length} selected</span>
          </div>
          <span className="text-slate-600">|</span>
          <div>
            <span className="text-slate-400 mr-1">Basic:</span>
            <span className="font-semibold text-white">{formatCurrency(totalBasic, 'INR')}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div>
            <span className="text-slate-400 mr-1">Allowances:</span>
            <span className="font-semibold text-emerald-400">+{formatCurrency(totalAllowances, 'INR')}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div>
            <span className="text-slate-400 mr-1">Deductions:</span>
            <span className="font-semibold text-rose-400">-{formatCurrency(totalDeductions, 'INR')}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div>
            <span className="text-slate-400 mr-1">Total Net:</span>
            <span className="font-extrabold text-emerald-400 text-sm">{formatCurrency(totalNet, 'INR')}</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedSlipIds([])}
            className="ml-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
          >
            Deselect All
          </button>
        </div>
      )}
    </PageContainer>
  );
}
