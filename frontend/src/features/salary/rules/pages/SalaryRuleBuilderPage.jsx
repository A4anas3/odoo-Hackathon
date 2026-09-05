import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { DataTable } from '@/components/table/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/modal/Modal';
import { FormField } from '@/components/form/FormField';
import { Input } from '@/components/form/Input';
import { Select } from '@/components/form/Select';
import { useToast } from '@/hooks/useToast';
import { Calculator, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salaryRuleApi } from '../api/salaryRuleApi';

const CATEGORY_COLORS = {
  BASIC: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ALLOWANCE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ALW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  GROSS: 'bg-blue-50 text-blue-700 border-blue-200',
  DEDUCTION: 'bg-rose-50 text-rose-700 border-rose-200',
  DED: 'bg-rose-50 text-rose-700 border-rose-200',
  TAX: 'bg-amber-50 text-amber-700 border-amber-200',
  NET: 'bg-purple-50 text-purple-700 border-purple-200 font-bold',
};

export function SalaryRuleBuilderPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    code: '',
    sequence: 1,
    category: 'ALLOWANCE',
    calculationType: 'FIXED',
    value: '',
    percentage: '',
    formula: '',
    description: '',
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['salaryRules'],
    queryFn: () => salaryRuleApi.getAllRules(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => salaryRuleApi.createRule(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['salaryRules'] });
      setIsModalOpen(false);
      setNewRule({
        name: '',
        code: '',
        sequence: (rules.length + 2),
        category: 'ALLOWANCE',
        calculationType: 'FIXED',
        value: '',
        percentage: '',
        formula: '',
        description: '',
      });
      toast.success(`Salary rule "${created.name || 'Rule'}" created successfully.`);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to create salary rule.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => salaryRuleApi.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaryRules'] });
      toast.success('Salary rule removed successfully.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to delete salary rule.');
    },
  });

  const handleAddRule = () => {
    if (!newRule.name.trim() || !newRule.code.trim()) {
      toast.error('Please enter both rule name and code.');
      return;
    }
    createMutation.mutate({
      name: newRule.name.trim(),
      code: newRule.code.trim().toUpperCase(),
      category: newRule.category,
      calculationType: newRule.calculationType,
      value: newRule.value ? Number(newRule.value) : null,
      percentage: newRule.percentage ? Number(newRule.percentage) : null,
      formula: newRule.formula ? newRule.formula.trim() : null,
      description: newRule.description ? newRule.description.trim() : null,
      sequence: Number(newRule.sequence) || (rules.length + 1),
    });
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const columns = [
    {
      header: 'Seq',
      key: 'sequence',
      width: '60px',
      render: (seq) => (
        <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-mono font-bold text-slate-600 text-[11px]">
          {seq || 1}
        </span>
      ),
    },
    {
      header: 'Rule Name',
      key: 'name',
      render: (name, row) => (
        <div>
          <span className="font-semibold text-slate-800 block">{name}</span>
          <span className="text-[11px] text-slate-400 font-mono font-bold">{row.code}</span>
        </div>
      ),
    },
    {
      header: 'Category',
      key: 'category',
      render: (cat) => (
        <span
          className={cn(
            'inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border',
            CATEGORY_COLORS[cat] || 'bg-slate-100 text-slate-600 border-slate-200'
          )}
        >
          {cat}
        </span>
      ),
    },
    {
      header: 'Calculation Type',
      key: 'calculationType',
      render: (type) => (
        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-mono">
          {type || 'FIXED'}
        </span>
      ),
    },
    {
      header: 'Computation Logic',
      key: 'formula',
      render: (formula, row) => {
        let display = '—';
        if (row.calculationType === 'PERCENTAGE') {
          display = `${row.percentage != null ? row.percentage : 0}% of base wage`;
        } else if (row.calculationType === 'FIXED') {
          display = `$${row.value != null ? row.value : 0} fixed`;
        } else if (row.calculationType === 'FORMULA' || formula) {
          display = formula || row.formula || 'Custom Formula';
        }
        return (
          <div className="font-mono text-[11px] text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100 max-w-sm truncate">
            {display}
          </div>
        );
      },
    },
    {
      header: 'Description',
      key: 'description',
      render: (desc) => <span className="text-slate-500 text-xs line-clamp-1">{desc || '—'}</span>,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="xs"
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          onClick={() => handleDelete(row.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Salary Rule Builder"
      description="Design automated computation pipelines for payroll components, allowances, and statutory withholdings."
      actions={
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Salary Rule
        </Button>
      }
    >
      {/* Execution Pipeline Header */}
      <div className="bg-[#714B67]/5 border border-[#714B67]/20 rounded-lg p-3.5 flex items-center gap-3 text-xs text-[#714B67] mb-4">
        <Calculator className="w-4 h-4 shrink-0" />
        <div>
          <span className="font-semibold">Execution Pipeline: </span>
          Rules are evaluated strictly by sequence order. Net salary is computed automatically after all earnings and deductions are resolved.
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rules}
        isLoading={isLoading}
        emptyTitle="No Salary Rules Configured"
        emptyDescription="No custom salary rules found. Click 'New Salary Rule' to configure earnings, allowances, and deductions."
      />

      {/* New Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Salary Rule"
        description="Define dynamic salary calculation logic and execution sequence"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Rule Name" required>
              <Input
                placeholder="e.g. Remote Stipend or Health Insurance"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              />
            </FormField>
            <FormField label="Rule Code" required helperText="Upper-case variable code (e.g. REMOTE)">
              <Input
                placeholder="e.g. REMOTE"
                value={newRule.code}
                onChange={(e) => setNewRule({ ...newRule, code: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Category">
              <Select
                options={[
                  { value: 'BASIC', label: 'BASIC (Base Wage)' },
                  { value: 'ALLOWANCE', label: 'ALLOWANCE (Earnings)' },
                  { value: 'GROSS', label: 'GROSS (Total Earnings)' },
                  { value: 'DEDUCTION', label: 'DEDUCTION (Pre-tax)' },
                  { value: 'TAX', label: 'TAX (Withholding)' },
                  { value: 'NET', label: 'NET (Take-Home)' },
                ]}
                value={newRule.category}
                onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
              />
            </FormField>
            <FormField label="Calculation Mode">
              <Select
                options={[
                  { value: 'FIXED', label: 'FIXED (Static Amount)' },
                  { value: 'PERCENTAGE', label: 'PERCENTAGE (% of Base)' },
                  { value: 'FORMULA', label: 'FORMULA (Expression)' },
                ]}
                value={newRule.calculationType}
                onChange={(e) => setNewRule({ ...newRule, calculationType: e.target.value })}
              />
            </FormField>
            <FormField label="Sequence">
              <Input
                type="number"
                value={newRule.sequence}
                onChange={(e) => setNewRule({ ...newRule, sequence: e.target.value })}
              />
            </FormField>
          </div>

          {newRule.calculationType === 'FORMULA' ? (
            <FormField label="Formula Expression" helperText="Use codes: BASIC, HRA, GROSS, etc.">
              <Input
                placeholder="e.g. BASIC * 0.15 + 100"
                value={newRule.formula}
                onChange={(e) => setNewRule({ ...newRule, formula: e.target.value })}
              />
            </FormField>
          ) : (
            <FormField label={newRule.calculationType === 'PERCENTAGE' ? 'Percentage (%)' : 'Amount ($)'}>
              <Input
                type="number"
                placeholder={newRule.calculationType === 'PERCENTAGE' ? '15' : '250'}
                value={newRule.calculationType === 'PERCENTAGE' ? newRule.percentage : newRule.value}
                onChange={(e) => {
                  if (newRule.calculationType === 'PERCENTAGE') {
                    setNewRule({ ...newRule, percentage: e.target.value });
                  } else {
                    setNewRule({ ...newRule, value: e.target.value });
                  }
                }}
              />
            </FormField>
          )}

          <FormField label="Description">
            <Input
              placeholder="e.g. Monthly stipend for remote employees"
              value={newRule.description}
              onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
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
              onClick={handleAddRule}
            >
              Save Rule
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
