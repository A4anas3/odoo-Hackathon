import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/modal/Modal';
import { FormField } from '@/components/form/FormField';
import { Input } from '@/components/form/Input';
import { Select } from '@/components/form/Select';
import { useToast } from '@/hooks/useToast';
import { Plus, Search, Info, Calculator, Layers } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salaryRuleApi } from '../api/salaryRuleApi';
import { salaryStructureApi } from '@/features/salary/structures/api/salaryStructureApi';

export function SalaryRuleBuilderPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedStructureFilter, setSelectedStructureFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newRule, setNewRule] = useState({
    name: '',
    code: '',
    sequence: 1,
    category: 'BASIC',
    salaryStructureId: '',
    calculationType: 'PERCENTAGE',
    value: '',
    percentage: '50',
    formula: '',
    description: '',
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['salaryRules'],
    queryFn: () => salaryRuleApi.getAllRules(),
  });

  const { data: structures = [] } = useQuery({
    queryKey: ['salaryStructures'],
    queryFn: () => salaryStructureApi.getAllStructures(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => salaryRuleApi.createRule(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['salaryRules'] });
      setIsModalOpen(false);
      setNewRule({
        name: '',
        code: '',
        sequence: (rules.length + 5),
        category: 'BASIC',
        salaryStructureId: structures[0]?.id || '',
        calculationType: 'PERCENTAGE',
        value: '',
        percentage: '50',
        formula: '',
        description: '',
      });
      toast.success(`Salary rule "${created.name || 'Rule'}" created successfully.`);
      if (created?.id) {
        navigate(ROUTES.SALARY_RULE_DETAIL(created.id));
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to create salary rule.');
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
      salaryStructureId: newRule.salaryStructureId || structures[0]?.id || null,
      calculationType: newRule.calculationType,
      value: newRule.value ? Number(newRule.value) : null,
      percentage: newRule.percentage ? Number(newRule.percentage) : null,
      formula: newRule.formula ? newRule.formula.trim() : null,
      description: newRule.description ? newRule.description.trim() : null,
      sequence: Number(newRule.sequence) || 1,
    });
  };

  // Filtered rules
  const filtered = rules.filter((r) => {
    // Structure filter
    if (selectedStructureFilter !== 'ALL') {
      const structName = r.salaryStructureName || r.salaryStructure?.name || '';
      if (!structName.toLowerCase().includes(selectedStructureFilter.toLowerCase())) {
        return false;
      }
    }

    // Search query
    if (!search) return true;
    const name = (r.name || '').toLowerCase();
    const code = (r.code || '').toLowerCase();
    const cat = (r.category || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || code.includes(q) || cat.includes(q);
  });

  const sortedRules = [...filtered].sort((a, b) => (a.sequence || 1) - (b.sequence || 1));

  return (
    <PageContainer
      title="Salary Rules"
      description="List view."
      actions={
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          NEW
        </Button>
      }
    >
      {/* Search & Structure Filter Bar (Matches Wireframe 5) */}
      <div className="bg-white p-3 rounded-lg border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-64 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search salary rules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#714B67] transition-all"
            />
          </div>

          <div className="w-48">
            <Select
              options={[
                { value: 'ALL', label: 'All Structures' },
                ...structures.map((s) => ({ value: s.name, label: s.name })),
              ]}
              value={selectedStructureFilter}
              onChange={(e) => setSelectedStructureFilter(e.target.value)}
            />
          </div>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {sortedRules.length} rule{sortedRules.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Salary Rules Table (Matches Wireframe 5 List View) */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Rule Name</th>
                <th className="p-3 font-mono">Code</th>
                <th className="p-3">Category</th>
                <th className="p-3">Structure</th>
                <th className="p-3 font-mono text-center">Sequence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRules.length > 0 ? (
                sortedRules.map((rule) => {
                  const cat = (rule.category || '').toUpperCase();
                  const isNet = cat === 'NET';
                  const isGross = cat === 'GROSS';
                  const isDed = cat === 'DED' || cat === 'DEDUCTION' || cat === 'TAX';
                  const structName = rule.salaryStructureName || rule.salaryStructure?.name || 'Regular Salary';

                  return (
                    <tr
                      key={rule.id || rule.code}
                      onClick={() => navigate(ROUTES.SALARY_RULE_DETAIL(rule.id))}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="p-3">
                        <span className="font-semibold text-slate-900 block leading-tight">{rule.name}</span>
                        <span className="text-[10px] text-slate-400">{rule.description || 'Calculation rule'}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">
                        {rule.code}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isNet
                              ? 'bg-[#714B67]/10 text-[#714B67] border-[#714B67]/30'
                              : isDed
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isGross
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {rule.category}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <Layers className="w-3 h-3 text-[#714B67]" />
                          {structName}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-800">
                        {rule.sequence ?? 1}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No salary rules found matching the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Salary Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Salary Rule"
        description="Define dynamic salary calculation logic and execution sequence."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Rule Name" required>
              <Input
                placeholder="e.g. Basic Salary"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              />
            </FormField>
            <FormField label="Rule Code" required helperText="Upper-case variable (e.g. BASIC)">
              <Input
                placeholder="e.g. BASIC"
                value={newRule.code}
                onChange={(e) => setNewRule({ ...newRule, code: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Salary Structure" required>
              <Select
                options={structures.map((s) => ({ value: s.id, label: s.name }))}
                value={newRule.salaryStructureId || (structures[0]?.id || '')}
                onChange={(e) => setNewRule({ ...newRule, salaryStructureId: e.target.value })}
              />
            </FormField>

            <FormField label="Category">
              <Select
                options={[
                  { value: 'BASIC', label: 'Basic' },
                  { value: 'ALLOWANCE', label: 'Allowance' },
                  { value: 'GROSS', label: 'Gross' },
                  { value: 'DEDUCTION', label: 'Deduction' },
                  { value: 'NET', label: 'Net' },
                ]}
                value={newRule.category}
                onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Computation Mode">
              <Select
                options={[
                  { value: 'PERCENTAGE', label: 'Percentage of Wage' },
                  { value: 'FIXED', label: 'Fixed Amount' },
                  { value: 'FORMULA', label: 'Python Code / Formula' },
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

          {newRule.calculationType === 'PERCENTAGE' ? (
            <FormField label="Percentage (%)">
              <Input
                type="number"
                placeholder="50"
                value={newRule.percentage}
                onChange={(e) => setNewRule({ ...newRule, percentage: e.target.value })}
              />
            </FormField>
          ) : newRule.calculationType === 'FIXED' ? (
            <FormField label="Fixed Amount (₹)">
              <Input
                type="number"
                placeholder="5000"
                value={newRule.value}
                onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
              />
            </FormField>
          ) : (
            <FormField label="Formula / Python Code">
              <Input
                placeholder="e.g. result = contract.wage * 0.5"
                value={newRule.formula}
                onChange={(e) => setNewRule({ ...newRule, formula: e.target.value })}
              />
            </FormField>
          )}

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
