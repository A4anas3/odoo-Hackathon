import React, { useState } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/table/DataTable';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import { Input } from '../../../components/form/Input';
import { Select } from '../../../components/form/Select';
import { contractApi, DEFAULT_CONTRACTS } from '../api/contractApi';
import { useQuery } from '@tanstack/react-query';
import { formatDate, formatCurrency } from '../../../lib/utils/formatters';
import { ROUTES } from '../../../config/routes';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye } from 'lucide-react';

export function ContractListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts', 'list'],
    queryFn: () => contractApi.getContracts(),
  });

  const filteredContracts = contracts.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    const empName = (c.employeeName || c.employee?.name || '').toLowerCase();
    const structName = (c.salaryStructureName || c.structureName || '').toLowerCase();
    const query = search.toLowerCase();
    if (search && !empName.includes(query) && !structName.includes(query)) {
      return false;
    }
    return true;
  });

  const columns = [
    {
      header: 'Employee',
      key: 'employee',
      render: (emp, row) => {
        const name = row.employeeName || emp?.name || '—';
        const code = row.employeeCode || emp?.code || '—';
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={name} size="sm" />
            <div>
              <span className="font-semibold text-slate-800 leading-tight block">{name}</span>
              <span className="text-[10px] text-slate-400 font-mono">{code}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Wage / Compensation',
      key: 'wage',
      render: (wage, row) => (
        <div>
          <span className="font-bold text-slate-900">{formatCurrency(row.salary || wage || 0)}</span>
          <span className="text-[10px] text-slate-400 block lowercase">/ {row.contractType || row.wageType || 'monthly'}</span>
        </div>
      ),
    },
    {
      header: 'Salary Structure',
      key: 'structureName',
      render: (name) => <span className="font-medium text-slate-700">{name || 'Standard'}</span>,
    },
    {
      header: 'Start Date',
      key: 'startDate',
      render: (date) => <span className="text-slate-600">{formatDate(date)}</span>,
    },
    {
      header: 'End Date',
      key: 'endDate',
      render: (date) => <span className="text-slate-500">{date ? formatDate(date) : 'Open-ended'}</span>,
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
          onClick={() => navigate(ROUTES.CONTRACT_DETAIL(row.id))}
          title="View Contract"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Employment Contracts"
      description="Manage contractual wage agreements, wage structures, and terms."
      actions={
        <Link to={ROUTES.CONTRACT_NEW}>
          <Button variant="primary" size="sm" icon={Plus}>
            New Contract
          </Button>
        </Link>
      }
    >
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-1 items-center gap-2.5 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search contracts..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-36">
            <Select
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'EXPIRED', label: 'Expired' },
                { value: 'TERMINATED', label: 'Terminated' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredContracts}
        isLoading={isLoading}
        emptyTitle="No contracts found"
        emptyDescription="Create a new employment contract to begin."
      />
    </PageContainer>
  );
}
