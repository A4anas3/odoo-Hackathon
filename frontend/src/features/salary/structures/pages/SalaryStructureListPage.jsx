import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { DataTable } from '@/components/table/DataTable';
import { StatusBadge } from '@/components/badge/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/modal/Modal';
import { FormField } from '@/components/form/FormField';
import { Input } from '@/components/form/Input';
import { Layers, Plus, Eye, Calculator, Trash2 } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salaryStructureApi } from '../api/salaryStructureApi';
import { useToast } from '@/hooks/useToast';

export function SalaryStructureListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const { data: structures = [], isLoading } = useQuery({
    queryKey: ['salaryStructures'],
    queryFn: () => salaryStructureApi.getAllStructures(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => salaryStructureApi.createStructure(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['salaryStructures'] });
      toast.success(`Salary structure "${created.name || formData.name}" created successfully.`);
      setIsModalOpen(false);
      setFormData({ name: '', description: '' });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to create salary structure.');
    },
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a structure name.');
      return;
    }
    createMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim(),
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => salaryStructureApi.deleteStructure(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaryStructures'] });
      toast.success('Salary structure removed successfully.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to delete salary structure.');
    },
  });

  const columns = [
    {
      header: 'Structure Name',
      key: 'name',
      render: (name, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#714B67]/10 flex items-center justify-center text-[#714B67] shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-800 block leading-tight">{name}</span>
            <span className="text-[11px] text-slate-500 line-clamp-1">{row.description || 'Standard Structure'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Rules',
      key: 'rules',
      render: (rules) => {
        const list = Array.isArray(rules) ? rules : [];
        if (list.length === 0) {
          return <span className="text-xs text-slate-400 italic">No rules attached</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-md">
            {list.map((r, idx) => {
              const label = typeof r === 'string' ? r : (r.code || r.name || `Rule #${idx + 1}`);
              return (
                <span
                  key={r.id || label || idx}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {label}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      header: 'Total Rules',
      key: 'rulesCount',
      render: (count, row) => {
        const total = count ?? (row.rules?.length || 0);
        return (
          <span className="font-semibold text-slate-700 text-xs">
            {total} {total === 1 ? 'rule' : 'rules'}
          </span>
        );
      },
    },
    {
      header: 'Status',
      key: 'status',
      render: (s) => <StatusBadge status={s || 'ACTIVE'} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="xs"
            title="Configure Rules"
            onClick={() => navigate(ROUTES.SALARY_RULES)}
          >
            <Calculator className="w-3.5 h-3.5 text-[#714B67]" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="text-rose-600 hover:bg-rose-50"
            title="Delete Structure"
            onClick={() => deleteMutation.mutate(row.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Salary Structures"
      description="Manage organizational compensation structures, salary categories, and associated salary rules."
      actions={
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Structure
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={structures}
        isLoading={isLoading}
        emptyTitle="No Salary Structures"
        emptyDescription="No salary structures found. Click 'New Structure' to create one."
      />

      {/* New Structure Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Salary Structure"
        description="Add a new salary structure to group and apply salary rules."
      >
        <div className="space-y-4">
          <FormField label="Structure Name" required>
            <Input
              placeholder="e.g. Regular Salary or Executive Structure"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
          </FormField>

          <FormField label="Description">
            <Input
              placeholder="e.g. Standard monthly salary computation for full-time employees"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={createMutation.isPending}
              onClick={handleCreate}
            >
              Create Structure
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
