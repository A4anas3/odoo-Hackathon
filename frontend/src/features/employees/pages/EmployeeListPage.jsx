import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { EmployeeFilterBar } from '../components/EmployeeFilterBar';
import { DataTable } from '../../../components/table/DataTable';
import { Pagination } from '../../../components/table/Pagination';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Avatar } from '../../../components/ui/Avatar';
import { useEmployeesPaged } from '../hooks/useEmployees';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { PERMISSIONS } from '../../../config/permissions';
import { ROUTES } from '../../../config/routes';
import { Eye, Edit2, LayoutGrid, List } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export function EmployeeListPage() {
  const navigate = useNavigate();
  const { can } = useCurrentUser();

  // Wireframe: Default view Kanban
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { data: pagedData, isLoading } = useEmployeesPaged({
    page: page - 1,
    size: pageSize,
    search,
    department,
    status,
    type,
  });

  const paginatedEmployees = pagedData?.content || [];
  const totalItems = pagedData?.totalElements ?? paginatedEmployees.length;
  const totalPages = pagedData?.totalPages ?? (Math.ceil(totalItems / pageSize) || 1);

  const columns = [
    {
      header: 'Employee',
      key: 'name',
      render: (_, row) => (
        <div className="flex items-center gap-2.5 py-0.5">
          <Avatar name={`${row.firstName} ${row.lastName}`} size="sm" />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 leading-tight hover:text-blue-600 transition-colors">
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
      header: 'Work Email',
      key: 'email',
      render: (email) => <span className="font-mono text-xs text-slate-700">{email}</span>,
    },
    {
      header: 'Job Position',
      key: 'jobPosition',
      render: (job, row) => (
        <span className="text-slate-700 font-medium">{row.jobPositionTitle || job?.title || job?.name || '—'}</span>
      ),
    },
    {
      header: 'Department',
      key: 'department',
      render: (dept, row) => (
        <span className="text-slate-600">{row.departmentName || dept?.name || '—'}</span>
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
      actions={
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'kanban'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
        </div>
      }
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

      {viewMode === 'kanban' ? (
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading employees...</div>
          ) : paginatedEmployees.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">No employees found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedEmployees.map((emp) => {
                const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase() || 'EM';
                const isActive = (emp.status || 'ACTIVE').toUpperCase() === 'ACTIVE';

                return (
                  <div
                    key={emp.id}
                    onClick={() => navigate(ROUTES.EMPLOYEE_DETAIL(emp.id))}
                    className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:shadow-md hover:border-blue-400 cursor-pointer transition-all flex items-start gap-3.5 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {emp.firstName} {emp.lastName}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                        {emp.jobPositionTitle || emp.jobPosition?.title || 'Staff Member'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {emp.departmentName || emp.department?.name || 'General Department'}
                      </p>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            {emp.status}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {emp.employeeCode || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Wireframe helper note */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 italic">
            Useful note: Kanban is good for browsing; clicking a card opens the same Employee Form used everywhere else.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={paginatedEmployees}
            isLoading={isLoading}
            emptyTitle="No employees found"
            emptyDescription="Try adjusting your search criteria or add a new employee."
            onRowClick={(row) => navigate(ROUTES.EMPLOYEE_DETAIL(row.id))}
          />
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 italic">
            Useful note: the list view is the main entry point for opening a specific employee record quickly.
          </div>
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </PageContainer>
  );
}

export default EmployeeListPage;
