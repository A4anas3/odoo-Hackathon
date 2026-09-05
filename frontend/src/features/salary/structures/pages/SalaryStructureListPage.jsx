import React from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { DataTable } from '@/components/table/DataTable';
import { StatusBadge } from '@/components/badge/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Layers, Plus, Eye } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useNavigate } from 'react-router-dom';

const STRUCTURES = [
  {
    id: 'str-01',
    name: 'Regular Full-Time',
    code: 'RFT-STD',
    rulesCount: 7,
    rules: ['BASIC', 'HRA', 'TRANS', 'GROSS', 'TAX', 'PF', 'NET'],
    assignedContracts: 142,
    status: 'ACTIVE',
  },
  {
    id: 'str-02',
    name: 'Executive Management',
    code: 'EXEC-01',
    rulesCount: 8,
    rules: ['BASIC', 'HRA', 'EXEC_ALLOWANCE', 'TRANS', 'GROSS', 'TAX', 'PF', 'NET'],
    assignedContracts: 12,
    status: 'ACTIVE',
  },
  {
    id: 'str-03',
    name: 'Sales Commission Base',
    code: 'SALES-COMM',
    rulesCount: 6,
    rules: ['BASIC', 'COMMISSION', 'GROSS', 'TAX', 'PF', 'NET'],
    assignedContracts: 58,
    status: 'ACTIVE',
  },
  {
    id: 'str-04',
    name: 'Hourly Contractor',
    code: 'HOURLY-CONTR',
    rulesCount: 4,
    rules: ['HOURLY_WAGE', 'GROSS', 'WHT', 'NET'],
    assignedContracts: 24,
    status: 'ACTIVE',
  },
];

export function SalaryStructureListPage() {
  const navigate = useNavigate();

  const columns = [
    {
      header: 'Structure Name',
      key: 'name',
      render: (name, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#714B67]/10 flex items-center justify-center text-[#714B67]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-800 block">{name}</span>
            <span className="text-[10px] text-slate-400 font-mono font-bold">{row.code}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Rules',
      key: 'rules',
      render: (rules) => (
        <div className="flex flex-wrap gap-1 max-w-md">
          {rules.map((r) => (
            <span
              key={r}
              className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-100 text-slate-600 border border-slate-200"
            >
              {r}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: 'Active Contracts',
      key: 'assignedContracts',
      render: (c) => <span className="font-semibold text-slate-700">{c} contracts</span>,
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
          onClick={() => navigate(ROUTES.SALARY_STRUCTURE_DETAIL(row.id))}
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Salary Structures"
      description="Manage hierarchical salary templates and attached rule sequences."
      actions={
        <Button variant="primary" size="sm" icon={Plus}>
          New Structure
        </Button>
      }
    >
      <DataTable columns={columns} data={STRUCTURES} />
    </PageContainer>
  );
}
