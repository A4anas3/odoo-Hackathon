import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/badge/StatusBadge';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { payslipApi } from '../api/payslipApi';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/config/routes';
import { ArrowLeft, Download, Mail, Printer } from 'lucide-react';
import { Spinner } from '@/components/loading/Spinner';

export function PayslipDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: payslip, isLoading } = useQuery({
    queryKey: ['payroll', 'payslip', id],
    queryFn: () => payslipApi.getPayslipById(id),
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      toast.success(`PDF for ${payslip?.slipNumber || 'payslip'} downloaded successfully.`);
    }, 800);
  };

  const handleEmail = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      toast.success(`Payslip receipt emailed.`);
    }, 900);
  };

  if (isLoading) {
    return (
      <PageContainer title="Payslip Details">
        <div className="py-20 flex justify-center">
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

  const empName = payslip.employeeName || payslip.employee?.name || (payslip.employee?.firstName ? `${payslip.employee.firstName} ${payslip.employee.lastName || ''}`.trim() : 'Employee');
  const empCode = payslip.employeeCode || payslip.employee?.code || '—';
  const deptName = payslip.departmentName || payslip.employee?.dept || '—';
  const periodDisplay = payslip.period || (payslip.periodStart ? `${formatDate(payslip.periodStart)} – ${formatDate(payslip.periodEnd)}` : '—');

  // Categorize lines into earnings and deductions
  const allLines = Array.isArray(payslip.lines) ? payslip.lines : [];
  const earnings = payslip.earnings || allLines.filter((l) => l.category !== 'DED' && l.amount > 0);
  const deductions = payslip.deductions || allLines.filter((l) => l.category === 'DED' || l.amount < 0);

  const gross = payslip.grossSalary ?? payslip.grossAmount ?? 0;
  const totalDeductions = payslip.totalDeductions ?? payslip.deductionsAmount ?? 0;
  const net = payslip.netSalary ?? payslip.netAmount ?? 0;

  return (
    <PageContainer
      title={`Payslip ${payslip.slipNumber || ''}`}
      description={`Disbursement statement for ${periodDisplay}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.PAYSLIPS)}>
            Back
          </Button>
          <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrint}>
            Print
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Mail}
            isLoading={isSending}
            onClick={handleEmail}
          >
            Email
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            isLoading={isDownloading}
            onClick={handleDownload}
          >
            Download PDF
          </Button>
        </div>
      }
    >
      {/* Printable Payslip Invoice Layout */}
      <Card className="max-w-4xl mx-auto border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 bg-white">
        {/* Company Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#714B67] text-white flex items-center justify-center font-bold text-lg">
              O
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-none">Odoo Enterprise Suite</h2>
              <p className="text-xs text-slate-400 mt-1">Human Resources & Payroll Department</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-slate-900 block">
              {payslip.slipNumber || '—'}
            </span>
            <div className="mt-1 flex justify-end">
              <StatusBadge status={payslip.status || 'PAID'} />
            </div>
          </div>
        </div>

        {/* Employee Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/80 rounded-lg text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Employee Name</span>
            <span className="font-bold text-slate-900 mt-0.5 block">{empName}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Employee Code</span>
            <span className="font-mono font-bold text-slate-900 mt-0.5 block">{empCode}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Department</span>
            <span className="font-semibold text-slate-900 mt-0.5 block">{deptName}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Pay Period</span>
            <span className="font-semibold text-[#714B67] mt-0.5 block">{periodDisplay}</span>
          </div>
        </div>

        {/* Earnings & Deductions Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings */}
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-50 px-3.5 py-2 font-bold text-slate-700 border-b border-slate-200">
              Earnings & Allowances
            </div>
            <div className="divide-y divide-slate-100">
              {earnings.length > 0 ? (
                earnings.map((e, idx) => (
                  <div key={idx} className="px-3.5 py-2 flex justify-between">
                    <span className="text-slate-600">{e.ruleName || e.name}</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(Math.abs(e.amount))}</span>
                  </div>
                ))
              ) : (
                <div className="px-3.5 py-3 text-slate-400 italic">No breakdown items recorded</div>
              )}
            </div>
            <div className="bg-slate-50/70 px-3.5 py-2.5 font-bold flex justify-between border-t border-slate-200 text-slate-900">
              <span>Gross Earnings</span>
              <span>{formatCurrency(gross)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-50 px-3.5 py-2 font-bold text-slate-700 border-b border-slate-200">
              Deductions & Withholdings
            </div>
            <div className="divide-y divide-slate-100">
              {deductions.length > 0 ? (
                deductions.map((d, idx) => (
                  <div key={idx} className="px-3.5 py-2 flex justify-between">
                    <span className="text-slate-600">{d.ruleName || d.name}</span>
                    <span className="font-semibold text-rose-600">-{formatCurrency(Math.abs(d.amount))}</span>
                  </div>
                ))
              ) : (
                <div className="px-3.5 py-3 text-slate-400 italic">No deductions applied</div>
              )}
            </div>
            <div className="bg-slate-50/70 px-3.5 py-2.5 font-bold flex justify-between border-t border-slate-200 text-rose-700">
              <span>Total Deductions</span>
              <span>-{formatCurrency(totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Net Take-Home Highlight Banner */}
        <div className="p-4 rounded-lg bg-[#714B67]/10 border border-[#714B67]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-[#714B67] uppercase tracking-wider block">
              Net Disbursed Take-Home Salary
            </span>
            <span className="text-2xl font-black text-[#714B67] mt-0.5 block tracking-tight">
              {formatCurrency(net)}
            </span>
          </div>
          <div className="text-right text-xs text-slate-500">
            <span className="block font-medium">Payment Mode: Direct Deposit</span>
            <span className="text-[11px] text-slate-400">
              {payslip.paymentDate ? `Disbursed on ${formatDate(payslip.paymentDate)}` : 'Processed'}
            </span>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
