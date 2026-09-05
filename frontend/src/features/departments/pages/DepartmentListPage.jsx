import React, { useState } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/table/DataTable';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/modal/Modal';
import { FormField } from '../../../components/form/FormField';
import { Input } from '../../../components/form/Input';
import { Select } from '../../../components/form/Select';
import { useToast } from '../../../hooks/useToast';
import { Building2, Plus, Users } from 'lucide-react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentApi } from '../api/departmentApi';
import { useEmployees } from '../../employees/hooks/useEmployees';

export function DepartmentListPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', description: '', status: 'ACTIVE' });

  const { data: employees = [] } = useEmployees();

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getAllDepartments(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => departmentApi.createDepartment(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsModalOpen(false);
      setNewDept({ name: '', description: '', status: 'ACTIVE' });
      toast.success(`Department ${created.name} created successfully.`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create department.');
    },
  });

  const handleCreate = () => {
    if (!newDept.name) {
      toast.error('Please enter department name.');
      return;
    }
    createMutation.mutate(newDept);
  };

  const columns = [
    {
      header: 'Department',
      key: 'name',
      render: (name, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-800 leading-tight block">{name}</span>
            <span className="text-[10px] text-slate-400 font-mono font-bold">{row.code}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Head / Manager',
      key: 'manager',
      render: (manager) => <span className="font-medium text-slate-700">{manager}</span>,
    },
    {
      header: 'Total Staff',
      key: 'employeeCount',
      render: (count) => (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          <Users className="w-3 h-3 text-slate-400" />
          {count} staff
        </span>
      ),
    },
    {
      header: 'Monthly Budget',
      key: 'budget',
      render: (b) => <span className="font-semibold text-slate-900">{b}</span>,
    },
  ];

  return (
    <PageContainer
      title="Departments"
      description="Company organizational business units and division structure."
      actions={
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Department
        </Button>
      }
    >
      <DataTable columns={columns} data={departments} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Department"
        subtitle="Add a new business unit to the organization"
      >
        <div className="space-y-4">
          <FormField label="Department Name" required>
            <Input
              placeholder="e.g. Marketing"
              value={newDept.name}
              onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
            />
          </FormField>
          <FormField label="Department Code" required helperText="Short acronym (e.g. MKT)">
            <Input
              placeholder="e.g. MKT"
              value={newDept.code}
              onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
            />
          </FormField>
          <FormField label="Department Head">
            <Select
              options={
                employees.length > 0
                  ? employees.map((e) => `${e.firstName} ${e.lastName || ''}`.trim())
                  : ['None']
              }
              value={newDept.manager}
              onChange={(e) => setNewDept({ ...newDept, manager: e.target.value })}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              Save Department
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
