import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { DataTable } from '@/components/table/DataTable';
import { StatusBadge } from '@/components/badge/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/form/Input';
import { Select } from '@/components/form/Select';
import { payslipApi, DEFAULT_PAYSLIPS } from '../api/payslipApi';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils/formatters';
import { ROUTES } from '@/config/routes';
import { Receipt, Search, Eye, Download } from 'lucide-react';

export function PayslipListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('ALL');

  const { data: payslips = [], isLoading } = useQuery({
    queryKey: ['payroll', 'payslips'],
    queryFn: () => payslipApi.getMyPayslips(),
  });

  const filtered = payslips.filter((p) => {
    if (search && !p.employee?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const columns = [
    {
      header: 'Slip Number',
      key: 'slipNumber',
      render: (num) => (
        <span className="font-mono font-semibold text-slate-800 text-xs">{num}</span>
      ),
    },
    {
      header: 'Employee',
      key: 'employee',
      render: (emp) => (
        <div>
          <span className="font-semibold text-slate-900 block leading-tight">{emp?.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">{emp?.code} • {emp?.dept}</span>
        </div>
      ),
    },
    {
      header: 'Period',
      key: 'period',
      render: (period) => <span className="font-medium text-slate-700">{period}</span>,
    },
    {
      header: 'Gross Earnings',
      key: 'grossAmount',
      render: (amount) => <span className="font-semibold text-slate-800">{formatCurrency(amount)}</span>,
    },
    {
      header: 'Deductions',
      key: 'deductionsAmount',
      render: (amount) => <span className="font-semibold text-rose-600">-{formatCurrency(amount)}</span>,
    },
    {
      header: 'Net Payout',
      key: 'netAmount',
      render: (amount) => (
        <span className="font-bold text-emerald-700 text-xs">{formatCurrency(amount)}</span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => navigate(ROUTES.PAYSLIP_DETAIL(row.id))}
          title="Inspect Payslip"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Employee Payslips"
      description="View and download individualized payroll calculation breakdowns and tax receipts."
    >
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-1 items-center gap-2.5 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search by employee name..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        onRowClick={(row) => navigate(ROUTES.PAYSLIP_DETAIL(row.id))}
      />
    </PageContainer>
  );
}
