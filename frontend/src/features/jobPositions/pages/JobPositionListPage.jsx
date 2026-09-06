import React, { useState } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/table/DataTable';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/modal/Modal';
import { FormField } from '../../../components/form/FormField';
import { Input } from '../../../components/form/Input';
import { Select } from '../../../components/form/Select';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { useToast } from '../../../hooks/useToast';
import { Briefcase, Plus, Users } from 'lucide-react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobPositionApi } from '../api/jobPositionApi';
import { departmentApi } from '../../departments/api/departmentApi';
import { useEmployees } from '../../employees/hooks/useEmployees';

export function JobPositionListPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', departmentId: '', description: '', status: 'ACTIVE' });

  const { data: positions = [], isLoading } = useQuery({
    queryKey: ['jobPositions'],
    queryFn: () => jobPositionApi.getAllJobPositions(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getAllDepartments(),
  });

  const { data: employees = [] } = useEmployees();

  const getStaffCount = (row) => {
    if (typeof row.currentStaff === 'number') return row.currentStaff;
    return employees.filter(
      (e) => e.jobPositionId === row.id || e.jobPositionTitle === row.title || e.jobPosition?.id === row.id
    ).length;
  };

  const createMutation = useMutation({
    mutationFn: (data) => jobPositionApi.createJobPosition(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['jobPositions'] });
      setIsModalOpen(false);
      setNewJob({ title: '', departmentId: '', description: '', status: 'ACTIVE' });
      toast.success(`Job position ${created.title} created successfully.`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create job position.');
    },
  });

  const handleCreate = () => {
    if (!newJob.title) {
      toast.error('Job position title is required.');
      return;
    }
    const deptId = newJob.departmentId || (departments[0] ? departments[0].id : null);
    if (!deptId) {
      toast.error('Please select a department.');
      return;
    }
    createMutation.mutate({ ...newJob, departmentId: deptId });
  };

  const columns = [
    {
      header: 'Job Title',
      key: 'title',
      render: (title) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#714B67]/10 flex items-center justify-center text-[#714B67]">
            <Briefcase className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-800">{title}</span>
        </div>
      ),
    },
    {
      header: 'Department',
      key: 'departmentName',
      render: (dept, row) => (
        <span className="font-medium text-slate-700">
          {dept || row.department?.name || '—'}
        </span>
      ),
    },
    {
      header: 'Current Staffing',
      key: 'currentStaff',
      render: (cur, row) => {
        const count = getStaffCount(row);
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>{count} {count === 1 ? 'employee' : 'employees'}</span>
          </span>
        );
      },
    },
    {
      header: 'Status',
      key: 'status',
      render: (s) => <StatusBadge status={s} />,
    },
  ];

  return (
    <PageContainer
      title="Job Positions"
      description="Corporate role catalog, designated functions, and headcount targets."
      actions={
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Position
        </Button>
      }
    >
      <DataTable columns={columns} data={positions} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Job Position"
        subtitle="Define a corporate position and assign it to a department"
      >
        <div className="space-y-4">
          <FormField label="Job Title" required>
            <Input
              placeholder="e.g. Lead QA Engineer"
              value={newJob.title}
              onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
            />
          </FormField>
          <FormField label="Department" required>
            <Select
              options={['Engineering', 'Management', 'Sales', 'Human Resources', 'Finance']}
              value={newJob.department}
              onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
            />
          </FormField>
          <FormField label="Target Headcount">
            <Input
              type="number"
              value={newJob.targetStaff}
              onChange={(e) => setNewJob({ ...newJob, targetStaff: e.target.value })}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              Save Position
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
