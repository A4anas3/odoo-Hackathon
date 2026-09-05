import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { DataTable } from '@/components/table/DataTable';
import { StatusBadge } from '@/components/badge/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/form/Input';
import { payslipApi } from '../api/payslipApi';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { PERMISSIONS } from '@/config/permissions';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils/formatters';
import { ROUTES } from '@/config/routes';
import { Receipt, Search, Eye } from 'lucide-react';

export function PayslipListPage() {
  const navigate = useNavigate();
  const { can } = useCurrentUser();
  const isAdminOrPayroll = can(PERMISSIONS.CAN_RUN_PAYROLL);

  const [search, setSearch] = useState('');

  const { data: payslips = [], isLoading } = useQuery({
    queryKey: ['payroll', 'payslips', isAdminOrPayroll],
    queryFn: () => (isAdminOrPayroll ? payslipApi.getAllPayslips() : payslipApi.getMyPayslips()),
  });

  const filtered = payslips.filter((p) => {
    if (!search) return true;
    const name = (p.employeeName || p.employee?.name || '').toLowerCase();
    const slip = (p.slipNumber || '').toLowerCase();
    return name.includes(search.toLowerCase()) || slip.includes(search.toLowerCase());
  });

  const columns = [
    {
      header: 'Slip Number',
      key: 'slipNumber',
      render: (num) => (
        <span className="font-mono font-semibold text-slate-800 text-xs">{num || '—'}</span>
      ),
    },
    ...(isAdminOrPayroll
      ? [
          {
            header: 'Employee',
            key: 'employee',
            render: (_, row) => {
              const name = row.employeeName || row.employee?.name || 'Staff';
              const code = row.employeeCode || row.employee?.code || '—';
              const dept = row.departmentName || row.employee?.dept || '';
              return (
                <div>
                  <span className="font-semibold text-slate-900 block leading-tight">{name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {code} {dept ? `• ${dept}` : ''}
                  </span>
                </div>
              );
            },
          },
        ]
      : []),
    {
      header: 'Period',
      key: 'period',
      render: (period, row) => <span className="font-medium text-slate-700">{period || `${row.periodStart || ''} – ${row.periodEnd || ''}`}</span>,
    },
    {
      header: 'Gross Earnings',
      key: 'grossAmount',
      render: (amount, row) => <span className="font-semibold text-slate-800">{formatCurrency(amount || row.grossSalary || 0)}</span>,
    },
    {
      header: 'Deductions',
      key: 'deductionsAmount',
      render: (amount, row) => <span className="text-rose-600 font-medium">-{formatCurrency(amount || row.totalDeductions || 0)}</span>,
    },
    {
      header: 'Net Pay',
      key: 'netAmount',
      render: (amount, row) => (
        <span className="font-bold text-emerald-700 font-mono">
          {formatCurrency(amount || row.netSalary || 0)}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (status) => <StatusBadge status={status || 'PAID'} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="xs"
          icon={Eye}
          onClick={() => navigate(ROUTES.PAYSLIP_DETAIL(row.id))}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title={isAdminOrPayroll ? 'All Issued Payslips' : 'My Payslips'}
      description={
        isAdminOrPayroll
          ? 'Browse and audit all monthly payroll statements issued to staff.'
          : 'Access and download your personal salary compensation records.'
      }
    >
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search payslips..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filtered.length} payslip{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyTitle="No payslips available"
        emptyDescription={
          isAdminOrPayroll
            ? 'No payslips have been generated in this system yet.'
            : 'No payslips have been generated for your employee profile yet.'
        }
      />
    </PageContainer>
  );
}
