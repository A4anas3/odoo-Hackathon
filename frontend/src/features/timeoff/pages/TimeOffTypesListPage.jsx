import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/table/DataTable';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/form/Input';
import { Select } from '../../../components/form/Select';
import { Modal } from '../../../components/modal/Modal';
import { FormField } from '../../../components/form/FormField';
import { timeoffApi } from '../api/timeoffApi';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { PERMISSIONS } from '../../../config/permissions';
import { ROUTES } from '../../../config/routes';
import { useToast } from '../../../hooks/useToast';
import { 
  Plus, Search, Info, ChevronRight, Settings2, 
  CalendarDays, CheckCircle 
} from 'lucide-react';

export function TimeOffTypesListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = useCurrentUser();
  const canManage = can(PERMISSIONS.CAN_MANAGE_SCHEDULES);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Type State
  const [formData, setFormData] = useState({
    name: '',
    unit: 'Days',
    requiresAllocation: true,
    approvalType: 'Manager',
    payrollWorkEntry: 'Leave Work Entry',
    displayColor: 'Blue',
    description: '',
    configurationNotes: '',
    paid: true,
  });

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['timeoff', 'types'],
    queryFn: () => timeoffApi.getTypes(),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => timeoffApi.createTimeOffType(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff', 'types'] });
      toast.success('Time Off Type policy created.');
      setIsModalOpen(false);
      setFormData({
        name: '',
        unit: 'Days',
        requiresAllocation: true,
        approvalType: 'Manager',
        payrollWorkEntry: 'Leave Work Entry',
        displayColor: 'Blue',
        description: '',
        configurationNotes: '',
        paid: true,
      });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to create time off type.');
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Type name is required.');
      return;
    }
    createMutation.mutate(formData);
  };

  const filteredTypes = useMemo(() => {
    return types.filter((t) => {
      if (search.trim()) {
        const query = search.toLowerCase();
        const name = (t.name || '').toLowerCase();
        const unit = (t.unit || '').toLowerCase();
        const approval = (t.approvalType || '').toLowerCase();
        if (!name.includes(query) && !unit.includes(query) && !approval.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [types, search]);

  // Columns matching Wireframe 5:
  // Type, Unit, Allocation, Approval, Status
  const columns = [
    {
      header: 'Type',
      key: 'name',
      render: (name, row) => (
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor:
                row.displayColor?.toLowerCase() === 'orange'
                  ? '#EA580C'
                  : row.displayColor?.toLowerCase() === 'green'
                  ? '#16A34A'
                  : '#2563EB',
            }}
          />
          <span className="font-semibold text-slate-900">{name}</span>
        </div>
      ),
    },
    {
      header: 'Unit',
      key: 'unit',
      render: (unit) => <span className="font-medium text-slate-700">{unit || 'Days'}</span>,
    },
    {
      header: 'Allocation',
      key: 'requiresAllocation',
      render: (req) => (
        <span className={`font-semibold ${req ? 'text-slate-900' : 'text-slate-500'}`}>
          {req ? 'Required' : 'No'}
        </span>
      ),
    },
    {
      header: 'Approval',
      key: 'approvalType',
      render: (approval) => (
        <span className="font-medium text-slate-700">{approval || 'Manager'}</span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (status) => <StatusBadge status={status || 'ACTIVE'} />,
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
      title="Time Off Types"
      description="List view opened from Time Off v -> Time Off Types"
      breadcrumbs={[
        { label: 'Time Off', href: ROUTES.TIMEOFF },
        { label: 'Time Off Types' },
      ]}
    >
      {/* Filter Bar matching Wireframe 5: [NEW] [Search time off types...] */}
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
              placeholder="Search time off types..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredTypes.length} type{filteredTypes.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Types Table - Clicking row navigates to Detail Form View */}
      <DataTable
        columns={columns}
        data={filteredTypes}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/time-off/types/${row.id}`)}
        emptyTitle="No time off types"
        emptyDescription="No leave policy definitions configured."
      />

      {/* Useful Note Footer matching wireframe specification */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-center gap-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-medium leading-relaxed">
          <strong>Useful note:</strong> this list defines policy rules, not employee transactions.
        </span>
      </div>

      {/* NEW Type Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Define Time Off Type Policy"
        description="Configure how this leave category behaves and its approval workflow."
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
              Save Policy
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <FormField label="Type Name" required>
            <Input
              placeholder="e.g. Paid Time Off"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Unit">
              <Select
                options={[
                  { value: 'Days', label: 'Days' },
                  { value: 'Hours', label: 'Hours' },
                ]}
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </FormField>

            <FormField label="Approval Level">
              <Select
                options={[
                  { value: 'Manager', label: 'Manager' },
                  { value: 'Officer', label: 'Officer' },
                  { value: 'No Validation', label: 'No Validation' },
                ]}
                value={formData.approvalType}
                onChange={(e) => setFormData({ ...formData, approvalType: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Requires Allocation">
              <Select
                options={[
                  { value: 'true', label: 'Yes (Allocation Required)' },
                  { value: 'false', label: 'No (Direct Request)' },
                ]}
                value={String(formData.requiresAllocation)}
                onChange={(e) => setFormData({ ...formData, requiresAllocation: e.target.value === 'true' })}
              />
            </FormField>

            <FormField label="Display Color">
              <Select
                options={[
                  { value: 'Blue', label: 'Blue' },
                  { value: 'Orange', label: 'Orange' },
                  { value: 'Green', label: 'Green' },
                  { value: 'Purple', label: 'Purple' },
                ]}
                value={formData.displayColor}
                onChange={(e) => setFormData({ ...formData, displayColor: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Payroll / Work Entry">
            <Input
              placeholder="Leave Work Entry"
              value={formData.payrollWorkEntry}
              onChange={(e) => setFormData({ ...formData, payrollWorkEntry: e.target.value })}
            />
          </FormField>

          <FormField label="Configuration Notes">
            <textarea
              rows={2}
              value={formData.configurationNotes}
              onChange={(e) => setFormData({ ...formData, configurationNotes: e.target.value })}
              placeholder="Standard annual leave. Balance comes from approved allocations."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#714B67] focus:border-[#714B67]"
            />
          </FormField>
        </form>
      </Modal>
    </PageContainer>
  );
}
