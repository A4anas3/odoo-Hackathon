import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/table/DataTable';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/form/Input';
import { Select } from '../../../components/form/Select';
import { Modal } from '../../../components/modal/Modal';
import { FormField } from '../../../components/form/FormField';
import { Avatar } from '../../../components/ui/Avatar';
import { timeoffApi } from '../api/timeoffApi';
import { employeeApi } from '../../employees/api/employeeApi';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { PERMISSIONS } from '../../../config/permissions';
import { ROUTES } from '../../../config/routes';
import { useToast } from '../../../hooks/useToast';
import { 
  Plus, Search, Info, ChevronRight, Layers, 
  Check, X, AlertCircle 
} from 'lucide-react';

export function AllocationsListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = useCurrentUser();
  const canManage = can(PERMISSIONS.CAN_APPROVE_LEAVE);

  const [searchParams, setSearchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employeeId');

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Allocation Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    timeOffTypeId: '',
    periodStart: '2026-01-01',
    periodEnd: '2026-12-31',
    allocatedDays: '20',
  });

  // Queries
  const { data: rawAllocations = [], isLoading } = useQuery({
    queryKey: ['timeoff', 'allocations', employeeIdParam || 'all'],
    queryFn: () => timeoffApi.getAllocations(employeeIdParam),
  });

  const { data: types = [] } = useQuery({
    queryKey: ['timeoff', 'types'],
    queryFn: () => timeoffApi.getTypes(),
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'options'],
    queryFn: () => employeeApi.getEmployees({ size: 100 }),
    enabled: canManage,
  });

  const employees = employeesData?.content || [];

  // Mutation
  const createMutation = useMutation({
    mutationFn: (payload) => timeoffApi.createAllocation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff', 'allocations'] });
      toast.success('Allocation created successfully.');
      setIsModalOpen(false);
      setFormData({
        employeeId: '',
        timeOffTypeId: '',
        periodStart: '2026-01-01',
        periodEnd: '2026-12-31',
        allocatedDays: '20',
      });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to create allocation.');
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.timeOffTypeId || !formData.allocatedDays) {
      toast.error('Please select an employee, leave type, and day count.');
      return;
    }
    createMutation.mutate({
      employeeId: formData.employeeId,
      timeOffTypeId: formData.timeOffTypeId,
      periodStart: formData.periodStart,
      periodEnd: formData.periodEnd,
      allocatedDays: parseFloat(formData.allocatedDays) || 0,
    });
  };

  // Filter
  const filteredAllocations = useMemo(() => {
    return rawAllocations.filter((alloc) => {
      if (employeeIdParam && alloc.employeeId !== employeeIdParam) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const emp = (alloc.employeeName || '').toLowerCase();
        const type = (alloc.timeOffTypeName || '').toLowerCase();
        const status = (alloc.status || '').toLowerCase();
        if (!emp.includes(query) && !type.includes(query) && !status.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [rawAllocations, employeeIdParam, search]);

  // Columns matching Wireframe 3:
  // Employee, Type, Allocated, Taken, Remaining, Status
  const columns = [
    {
      header: 'Employee',
      key: 'employee',
      render: (_, row) => {
        const name = row.employeeName || 'Staff Member';
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={name} size="sm" />
            <span className="font-semibold text-slate-800 block leading-tight">{name}</span>
          </div>
        );
      },
    },
    {
      header: 'Type',
      key: 'timeOffTypeName',
      render: (type) => <span className="font-medium text-slate-700">{type || 'Paid Time Off'}</span>,
    },
    {
      header: 'Allocated',
      key: 'allocatedDays',
      render: (days) => (
        <span className="font-semibold text-slate-900 font-mono text-xs">
          {days != null ? `${Number(days).toFixed(0)} days` : '0 days'}
        </span>
      ),
    },
    {
      header: 'Taken',
      key: 'usedDays',
      render: (days) => (
        <span className="font-mono text-slate-600 text-xs">
          {days != null ? `${Number(days).toFixed(0)} days` : '0 days'}
        </span>
      ),
    },
    {
      header: 'Remaining',
      key: 'remainingDays',
      render: (days) => (
        <span className="font-mono font-bold text-emerald-700 text-xs">
          {days != null ? `${Number(days).toFixed(0)} days` : '0 days'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (status) => {
        const display = status === 'TO_APPROVE' ? 'To Approve' : status;
        return <StatusBadge status={status || 'APPROVED'} label={display} />;
      },
    },
    {
      header: '',
      key: 'chevron',
      align: 'right',
      render: () => <ChevronRight className="w-4 h-4 text-slate-400 inline" />,
    },
  ];

  return (
    <PageContainer
      title="Allocations"
      description="List view opened from Time Off v -> Allocations"
      breadcrumbs={[
        { label: 'Time Off', href: ROUTES.TIMEOFF },
        { label: 'Allocations' },
      ]}
    >
      {/* Employee Filter Banner */}
      {employeeIdParam && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-2xs mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>
              Filtered by Employee:{' '}
              <strong className="font-semibold">
                {filteredAllocations[0]?.employeeName || 'Selected Employee'}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              searchParams.delete('employeeId');
              setSearchParams(searchParams);
            }}
            className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-semibold px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filter</span>
          </button>
        </div>
      )}

      {/* Filter Bar matching Wireframe 3: [NEW] [Search allocations...] */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {canManage && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsModalOpen(true)}
            >
              NEW
            </Button>
          )}

          <div className="w-64 max-w-full">
            <Input
              placeholder="Search allocations..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredAllocations.length} allocation{filteredAllocations.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Allocations Table - Clicking row navigates to Detail Form View */}
      <DataTable
        columns={columns}
        data={filteredAllocations}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/time-off/allocations/${row.id}`)}
        emptyTitle="No allocations found"
        emptyDescription="No leave balance allocations match your filter."
      />

      {/* Useful Note Footer matching wireframe specification */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-center gap-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-medium leading-relaxed">
          <strong>Useful note:</strong> the list should expose the balance math at a glance — Allocated, Taken and Remaining.
        </span>
      </div>

      {/* NEW Allocation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Grant Time Off Allocation"
        description="Assign a leave credit balance to an employee."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={createMutation.isPending}
              onClick={handleCreateSubmit}
            >
              Grant Allocation
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <FormField label="Employee" required>
            <Select
              placeholder="Select employee..."
              options={employees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName || ''} (${e.employeeCode || ''})` }))}
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            />
          </FormField>

          <FormField label="Time Off Type" required>
            <Select
              placeholder="Select leave type..."
              options={types.map((t) => ({ value: t.id, label: t.name }))}
              value={formData.timeOffTypeId}
              onChange={(e) => setFormData({ ...formData, timeOffTypeId: e.target.value })}
            />
          </FormField>

          <FormField label="Allocated Days" required>
            <Input
              type="number"
              step="1"
              min="1"
              value={formData.allocatedDays}
              onChange={(e) => setFormData({ ...formData, allocatedDays: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Validity Start" required>
              <Input
                type="date"
                value={formData.periodStart}
                onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
              />
            </FormField>

            <FormField label="Validity End" required>
              <Input
                type="date"
                value={formData.periodEnd}
                onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
              />
            </FormField>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
