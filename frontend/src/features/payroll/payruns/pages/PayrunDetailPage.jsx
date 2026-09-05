import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/badge/StatusBadge';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { payrunApi } from '../api/payrunApi';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ROUTES } from '@/config/routes';
import { ArrowLeft, Download, Inbox } from 'lucide-react';

export function PayrunDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: payrun = {}, isLoading } = useQuery({
    queryKey: ['payroll', 'payrun', id],
    queryFn: () => payrunApi.getPayrunById(id),
  });

  const enrolledPayslips = Array.isArray(payrun.payslips) ? payrun.payslips : [];
  const staffCount = enrolledPayslips.length || payrun.employeeCount || 0;
  const grossTotal = payrun.grossAmount ?? payrun.totalGross ?? 0;
  const netTotal = payrun.netAmount ?? payrun.totalNet ?? 0;

  return (
    <PageContainer
      title={payrun.name || 'Payrun Details'}
      description={`Period: ${formatDate(payrun.periodStart)} – ${formatDate(payrun.periodEnd)}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.PAYRUNS)}>
            Back
          </Button>
          <Button variant="primary" size="sm" icon={Download}>
            Export Summary (CSV)
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Batch Status</span>
          <div className="mt-1 flex justify-center">
            <StatusBadge status={payrun.status || 'DRAFT'} />
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

      <Card>
        <CardHeader title="Enrolled Employees & Payslips" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Basic Wage</th>
                  <th className="p-3">Gross</th>
                  <th className="p-3 text-rose-600">Deductions</th>
                  <th className="p-3 font-bold">Net Pay</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrolledPayslips.length > 0 ? (
                  enrolledPayslips.map((slip) => {
                    const name = slip.employeeName || slip.employee?.name || 'Staff';
                    const dept = slip.departmentName || slip.employee?.departmentName || '—';
                    const basic = slip.basicSalary || slip.wage || 0;
                    const gross = slip.grossSalary || slip.grossAmount || 0;
                    const ded = slip.totalDeductions || slip.deductionsAmount || 0;
                    const net = slip.netSalary || slip.netAmount || 0;
                    return (
                      <tr
                        key={slip.id}
                        className="hover:bg-slate-50/70 cursor-pointer"
                        onClick={() => navigate(ROUTES.PAYSLIP_DETAIL(slip.id))}
                      >
                        <td className="p-3 font-semibold text-slate-900">{name}</td>
                        <td className="p-3 text-slate-500">{dept}</td>
                        <td className="p-3">{formatCurrency(basic)}</td>
                        <td className="p-3">{formatCurrency(gross)}</td>
                        <td className="p-3 text-rose-600">-{formatCurrency(ded)}</td>
                        <td className="p-3 font-bold text-emerald-700">{formatCurrency(net)}</td>
                        <td className="p-3 text-center"><StatusBadge status={slip.status || 'PAID'} /></td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
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
