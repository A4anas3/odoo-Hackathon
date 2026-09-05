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
import { Briefcase, Plus } from 'lucide-react';

const INITIAL_POSITIONS = [
  { id: 'j1', title: 'Senior Fullstack Engineer', department: 'Engineering', targetStaff: 20, currentStaff: 18, status: 'ACTIVE' },
  { id: 'j2', title: 'Frontend Architect', department: 'Engineering', targetStaff: 4, currentStaff: 3, status: 'ACTIVE' },
  { id: 'j3', title: 'Regional Director', department: 'Management', targetStaff: 2, currentStaff: 2, status: 'ACTIVE' },
  { id: 'j4', title: 'Senior Account Executive', department: 'Sales', targetStaff: 30, currentStaff: 25, status: 'ACTIVE' },
  { id: 'j5', title: 'HR Generalist', department: 'Human Resources', targetStaff: 5, currentStaff: 4, status: 'ACTIVE' },
  { id: 'j6', title: 'Financial Analyst', department: 'Finance', targetStaff: 8, currentStaff: 6, status: 'ACTIVE' },
];

export function JobPositionListPage() {
  const toast = useToast();
  const [positions, setPositions] = useState(INITIAL_POSITIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', department: 'Engineering', targetStaff: 5 });

  const handleCreate = () => {
    if (!newJob.title) {
      toast.error('Job position title is required.');
      return;
    }
    const created = {
      id: `j-${Date.now()}`,
      title: newJob.title,
      department: newJob.department,
      targetStaff: Number(newJob.targetStaff),
      currentStaff: 0,
      status: 'ACTIVE',
    };
    setPositions([...positions, created]);
    setIsModalOpen(false);
    setNewJob({ title: '', department: 'Engineering', targetStaff: 5 });
    toast.success(`Job position ${created.title} created.`);
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
      key: 'department',
      render: (dept) => <span className="font-medium text-slate-700">{dept}</span>,
    },
    {
      header: 'Current Staffing',
      key: 'currentStaff',
      render: (cur, row) => (
        <span className="font-semibold text-slate-800">
          {cur} / {row.targetStaff} staff
        </span>
      ),
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
