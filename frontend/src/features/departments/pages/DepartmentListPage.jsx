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

const INITIAL_DEPARTMENTS = [
  { id: 'd1', name: 'Engineering', code: 'ENG', manager: 'Sarah Connor', employeeCount: 94, budget: '$680,000' },
  { id: 'd2', name: 'Management', code: 'MGT', manager: 'Michael Scott', employeeCount: 12, budget: '$240,000' },
  { id: 'd3', name: 'Sales', code: 'SLS', manager: 'Dwight Schrute', employeeCount: 58, budget: '$340,000' },
  { id: 'd4', name: 'Human Resources', code: 'HR', manager: 'Pam Beesly', employeeCount: 16, budget: '$160,000' },
  { id: 'd5', name: 'Finance', code: 'FIN', manager: 'Oscar Martinez', employeeCount: 22, budget: '$162,400' },
];

export function DepartmentListPage() {
  const toast = useToast();
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', code: '', manager: 'Sarah Connor' });

  const handleCreate = () => {
    if (!newDept.name || !newDept.code) {
      toast.error('Please enter department name and code.');
      return;
    }
    const created = {
      id: `d-${Date.now()}`,
      name: newDept.name,
      code: newDept.code.toUpperCase(),
      manager: newDept.manager,
      employeeCount: 0,
      budget: '$0',
    };
    setDepartments([...departments, created]);
    setIsModalOpen(false);
    setNewDept({ name: '', code: '', manager: 'Sarah Connor' });
    toast.success(`Department ${created.name} created.`);
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
              options={['Sarah Connor', 'Michael Scott', 'Dwight Schrute', 'Pam Beesly']}
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
