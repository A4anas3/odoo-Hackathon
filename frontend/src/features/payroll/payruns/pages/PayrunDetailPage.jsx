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
import { ArrowLeft, CheckCircle2, Download, Mail } from 'lucide-react';

export function PayrunDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: payrun = {} } = useQuery({
    queryKey: ['payroll', 'payrun', id],
    queryFn: () => payrunApi.getPayrunById(id),
  });

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
            <StatusBadge status={payrun.status || 'PAID'} />
          </div>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Enrolled</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">
            {payrun.employeeCount || 236} staff
          </span>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Gross Wage</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">
            {formatCurrency(payrun.grossAmount || 1860000)}
          </span>
        </Card>
        <Card className="p-4 text-center bg-[#714B67]/5 border-[#714B67]/20">
          <span className="text-[10px] text-[#714B67] uppercase font-semibold block">Net Disbursed</span>
          <span className="text-xl font-bold text-[#714B67] mt-1 block">
            {formatCurrency(payrun.netAmount || 1582400)}
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
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Sarah Connor</td>
                  <td className="p-3 text-slate-500">Engineering</td>
                  <td className="p-3">{formatCurrency(3250)}</td>
                  <td className="p-3">{formatCurrency(6500)}</td>
                  <td className="p-3 text-rose-600">-{formatCurrency(650)}</td>
                  <td className="p-3 font-bold text-emerald-700">{formatCurrency(5850)}</td>
                  <td className="p-3 text-center"><StatusBadge status="PAID" /></td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Michael Scott</td>
                  <td className="p-3 text-slate-500">Management</td>
                  <td className="p-3">{formatCurrency(4100)}</td>
                  <td className="p-3">{formatCurrency(8200)}</td>
                  <td className="p-3 text-rose-600">-{formatCurrency(820)}</td>
                  <td className="p-3 font-bold text-emerald-700">{formatCurrency(7380)}</td>
                  <td className="p-3 text-center"><StatusBadge status="PAID" /></td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Dwight Schrute</td>
                  <td className="p-3 text-slate-500">Sales</td>
                  <td className="p-3">{formatCurrency(2700)}</td>
                  <td className="p-3">{formatCurrency(5400)}</td>
                  <td className="p-3 text-rose-600">-{formatCurrency(540)}</td>
                  <td className="p-3 font-bold text-emerald-700">{formatCurrency(4860)}</td>
                  <td className="p-3 text-center"><StatusBadge status="PAID" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
