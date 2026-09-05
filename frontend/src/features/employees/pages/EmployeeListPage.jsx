import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { EmployeeFilterBar } from '../components/EmployeeFilterBar';
import { DataTable } from '../../../components/table/DataTable';
import { Pagination } from '../../../components/table/Pagination';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Avatar } from '../../../components/ui/Avatar';
import { useEmployees } from '../hooks/useEmployees';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { PERMISSIONS } from '../../../config/permissions';
import { ROUTES } from '../../../config/routes';
import { Eye, Edit2, MoreHorizontal } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export function EmployeeListPage() {
  const navigate = useNavigate();
  const { can } = useCurrentUser();

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: employees = [], isLoading } = useEmployees({
    search,
    department,
    status,
    type,
  });

  const totalPages = Math.ceil(employees.length / pageSize) || 1;
  const paginatedEmployees = employees.slice((page - 1) * pageSize, page * pageSize);

  const columns = [
    {
      header: 'Employee',
      key: 'name',
      render: (_, row) => (
        <div className="flex items-center gap-2.5 py-0.5">
          <Avatar name={`${row.firstName} ${row.lastName}`} size="sm" />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 leading-tight hover:text-[#714B67] transition-colors">
              {row.firstName} {row.lastName}
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
              {row.employeeCode || '—'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Department',
      key: 'department',
      render: (dept, row) => (
        <span className="font-medium text-slate-700">{row.departmentName || dept?.name || '—'}</span>
      ),
    },
    {
      header: 'Job Position',
      key: 'jobPosition',
      render: (job, row) => (
        <span className="text-slate-600">{row.jobPositionTitle || job?.title || job?.name || '—'}</span>
      ),
    },
    {
      header: 'Contact',
      key: 'email',
      render: (email, row) => (
        <div className="flex flex-col text-[11px]">
          <span className="text-slate-700">{email}</span>
          <span className="text-slate-400">{row.phone || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      key: 'employeeType',
      render: (type) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 uppercase">
          {type?.replace('_', ' ') || 'FULL TIME'}
        </span>
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
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => navigate(ROUTES.EMPLOYEE_DETAIL(row.id))}
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
          </Button>
          {can(PERMISSIONS.CAN_MANAGE_EMPLOYEES) && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate(ROUTES.EMPLOYEE_EDIT(row.id))}
              title="Edit Profile"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Employees"
      description="Manage enterprise staff records, organization structure, and personal files."
    >
      <EmployeeFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        department={department}
        onDepartmentChange={(v) => { setDepartment(v); setPage(1); }}
        status={status}
        onStatusChange={(v) => { setStatus(v); setPage(1); }}
        type={type}
        onTypeChange={(v) => { setType(v); setPage(1); }}
        canCreate={can(PERMISSIONS.CAN_MANAGE_EMPLOYEES)}
      />

      <DataTable
        columns={columns}
        data={paginatedEmployees}
        isLoading={isLoading}
        emptyTitle="No employees found"
        emptyDescription="Try adjusting your search criteria or add a new employee."
        onRowClick={(row) => navigate(ROUTES.EMPLOYEE_DETAIL(row.id))}
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={employees.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </PageContainer>
  );
}
