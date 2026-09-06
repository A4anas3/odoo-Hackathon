import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/table/DataTable';
import { Pagination } from '../../../components/table/Pagination';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import { Input } from '../../../components/form/Input';
import { Select } from '../../../components/form/Select';
import { contractApi } from '../api/contractApi';
import { useQuery } from '@tanstack/react-query';
import { formatDate, formatCurrency } from '../../../lib/utils/formatters';
import { ROUTES } from '../../../config/routes';
import { Plus, Search, Eye, X, FileText } from 'lucide-react';

export function ContractListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employeeId');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts', 'list', employeeIdParam || 'all'],
    queryFn: () =>
      employeeIdParam
        ? contractApi.getContractsByEmployeeId(employeeIdParam)
        : contractApi.getContracts(),
  });

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, employeeIdParam]);

  // Global search across all contracts prior to pagination
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (employeeIdParam && (c.employeeId !== employeeIdParam && c.employee?.id !== employeeIdParam)) {
        return false;
      }
      if (statusFilter !== 'ALL') {
        const cStatus = (c.status || '').toUpperCase();
        if (statusFilter === 'RUNNING' && cStatus !== 'RUNNING' && cStatus !== 'ACTIVE') return false;
        if (statusFilter !== 'RUNNING' && cStatus !== statusFilter) return false;
      }
      if (!search.trim()) return true;

      const query = search.toLowerCase().trim();
      const empName = (c.employeeName || c.employee?.name || '').toLowerCase();
      const empCode = (c.employeeCode || c.employee?.employeeCode || '').toLowerCase();
      const contractType = (c.contractType || '').toLowerCase();
      const structName = (c.salaryStructureName || c.structureName || '').toLowerCase();
      const schedName = (c.workingScheduleName || '').toLowerCase();
      const statusText = (c.status || '').toLowerCase();
      const wageStr = String(c.salary || '');
      const annualStr = String(Number(c.salary || 0) * 12);

      return (
        empName.includes(query) ||
        empCode.includes(query) ||
        contractType.includes(query) ||
        structName.includes(query) ||
        schedName.includes(query) ||
        statusText.includes(query) ||
        wageStr.includes(query) ||
        annualStr.includes(query)
      );
    });
  }, [contracts, employeeIdParam, statusFilter, search]);

  const totalItems = filteredContracts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedContracts = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredContracts.slice(start, start + pageSize);
  }, [filteredContracts, validCurrentPage, pageSize]);

  const clearEmployeeFilter = () => {
    searchParams.delete('employeeId');
    setSearchParams(searchParams);
  };

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
          <span className="text-[10px] text-slate-400 block lowercase">
            / {(row.wageType === 'HOURLY' || (row.contractType || '').toUpperCase().includes('HOUR')) ? 'hr' : 'mo'}
          </span>
        </div>
      ),
    },
    {
      header: 'Salary Structure',
      key: 'structureName',
      render: (_, row) => <span className="font-medium text-slate-700">{row.salaryStructureName || row.structureName || 'Standard'}</span>,
    },
    {
      header: 'Working Schedule',
      key: 'workingSchedule',
      render: (_, row) => <span className="text-slate-600 font-medium">{row.workingScheduleName || '40 Hours / Week'}</span>,
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
      description="Manage contractual wage agreements, wage structures, working patterns, and terms."
      actions={
        <Link to={ROUTES.CONTRACT_NEW}>
          <Button variant="primary" size="sm" icon={Plus}>
            New Contract
          </Button>
        </Link>
      }
    >
      <div className="space-y-3">
        {employeeIdParam && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>
                Filtered by Employee:{' '}
                <strong className="font-semibold">
                  {filteredContracts[0]?.employeeName || 'Selected Employee'}
                </strong>
              </span>
            </div>
            <button
              type="button"
              onClick={clearEmployeeFilter}
              className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-semibold px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filter</span>
            </button>
          </div>
        )}

        <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex flex-1 items-center gap-2.5 w-full sm:w-auto flex-wrap">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search by contract, employee, wage, or structure..."
                icon={Search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-36">
              <Select
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'RUNNING', label: 'Running' },
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'EXPIRED', label: 'Expired' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
            {(search || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          <div className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            {totalItems} {totalItems === 1 ? 'Contract' : 'Contracts'} Found
          </div>
        </div>

        <DataTable
          columns={columns}
          data={paginatedContracts}
          isLoading={isLoading}
          emptyTitle="No contracts found"
          emptyDescription="Create a new employment contract to begin."
        />

        <Pagination
          currentPage={validCurrentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </PageContainer>
  );
}

export default ContractListPage;
