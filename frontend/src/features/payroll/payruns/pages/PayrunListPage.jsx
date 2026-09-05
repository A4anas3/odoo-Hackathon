import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { DataTable } from '@/components/table/DataTable';
import { StatusBadge } from '@/components/badge/StatusBadge';
import { Button } from '@/components/ui/Button';
import { payrunApi } from '../api/payrunApi';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ROUTES } from '@/config/routes';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Coins, Eye } from 'lucide-react';

export function PayrunListPage() {
  const navigate = useNavigate();
  const { data: payruns = [], isLoading } = useQuery({
    queryKey: ['payroll', 'payruns'],
    queryFn: () => payrunApi.getAllPayruns(),
  });

  const columns = [
    {
      header: 'Payrun Name',
      key: 'name',
      render: (name, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#714B67]/10 flex items-center justify-center text-[#714B67]">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-800 leading-tight block">{name}</span>
            <span className="text-[10px] text-slate-400">
              {formatDate(row.periodStart)} – {formatDate(row.periodEnd)}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Headcount',
      key: 'employeeCount',
      render: (c) => <span className="font-medium text-slate-700">{c} staff</span>,
    },
    {
      header: 'Gross Total',
      key: 'grossAmount',
      render: (amount) => <span className="font-medium text-slate-800">{formatCurrency(amount)}</span>,
    },
    {
      header: 'Deductions',
      key: 'deductionsAmount',
      render: (amount) => (
        <span className="font-medium text-rose-600">-{formatCurrency(amount)}</span>
      ),
    },
    {
      header: 'Net Disbursement',
      key: 'netAmount',
      render: (amount) => (
        <span className="font-bold text-slate-900">{formatCurrency(amount)}</span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (s) => <StatusBadge status={s} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => navigate(ROUTES.PAYRUN_DETAIL(row.id))}
          title="View Payrun Details"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Payroll Runs"
      description="Process periodic salary batches, validate deductions, and authorize payouts."
      actions={
        <Link to={ROUTES.PAYRUN_NEW}>
          <Button variant="primary" size="sm" icon={Plus}>
            New Payrun
          </Button>
        </Link>
      }
    >
      <DataTable
        columns={columns}
        data={payruns}
        isLoading={isLoading}
        onRowClick={(row) => navigate(ROUTES.PAYRUN_DETAIL(row.id))}
      />
    </PageContainer>
  );
}
