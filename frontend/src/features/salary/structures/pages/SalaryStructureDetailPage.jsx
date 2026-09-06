import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { StatusBadge } from '@/components/badge/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/modal/Modal';
import { FormField } from '@/components/form/FormField';
import { Input } from '@/components/form/Input';
import { Select } from '@/components/form/Select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salaryStructureApi } from '../api/salaryStructureApi';
import { salaryRuleApi } from '@/features/salary/rules/api/salaryRuleApi';
import { ROUTES } from '@/config/routes';
import { ArrowLeft, Layers, Info, CheckCircle2, Plus, Copy, Edit2, Trash2, Calculator, Percent, IndianRupee, Code2 } from 'lucide-react';
import { Spinner } from '@/components/loading/Spinner';
import { useToast } from '@/hooks/useToast';

export function SalaryStructureDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [sourceStructureId, setSourceStructureId] = useState('');

  const [ruleFormData, setRuleFormData] = useState({
    name: '',
    code: '',
    category: 'BASIC',
    calculationType: 'PERCENTAGE',
    percentage: '50',
    value: '',
    formula: '',
    sequence: 10,
  });

  const { data: structure, isLoading: isStructureLoading } = useQuery({
    queryKey: ['salaryStructures', id],
    queryFn: () => salaryStructureApi.getStructureById(id),
  });

  const { data: allStructures = [] } = useQuery({
    queryKey: ['salaryStructures'],
    queryFn: () => salaryStructureApi.getAllStructures(),
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: (data) => salaryRuleApi.createRule(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['salaryStructures', id] });
      queryClient.invalidateQueries({ queryKey: ['salaryStructures'] });
      queryClient.invalidateQueries({ queryKey: ['salaryRules'] });
      toast.success(`Salary rule "${created.name || ruleFormData.name}" added successfully.`);
      setIsAddModalOpen(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to add rule.');
    },
  });

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: ({ ruleId, data }) => salaryRuleApi.updateRule(ruleId, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['salaryStructures', id] });
      queryClient.invalidateQueries({ queryKey: ['salaryStructures'] });
      queryClient.invalidateQueries({ queryKey: ['salaryRules'] });
      toast.success(`Salary rule "${updated.name || ruleFormData.name}" updated successfully.`);
      setIsAddModalOpen(false);
      setEditingRule(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to update rule.');
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId) => salaryRuleApi.deleteRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaryStructures', id] });
      queryClient.invalidateQueries({ queryKey: ['salaryStructures'] });
      queryClient.invalidateQueries({ queryKey: ['salaryRules'] });
      toast.success('Salary rule deleted successfully.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to delete rule.');
    },
  });

  // Copy rules mutation
  const copyRulesMutation = useMutation({
    mutationFn: (srcId) => salaryStructureApi.copyRules(id, srcId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaryStructures', id] });
      queryClient.invalidateQueries({ queryKey: ['salaryStructures'] });
      queryClient.invalidateQueries({ queryKey: ['salaryRules'] });
      toast.success('Salary rules copied successfully.');
      setIsCopyModalOpen(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to copy rules.');
    },
  });

  if (isStructureLoading) {
    return (
      <PageContainer title="Salary Structure">
        <div className="py-24 flex justify-center">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (!structure) {
    return (
      <PageContainer title="Salary Structure">
        <div className="py-16 text-center text-slate-500">
          <p className="font-semibold text-sm">Salary structure not found.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate(ROUTES.SALARY_STRUCTURES)}>
            Back to Structures
          </Button>
        </div>
      </PageContainer>
    );
  }

  // Real backend rules list
  const structureRules = structure.rules || [];
  const sortedRules = [...structureRules].sort((a, b) => (a.sequence || 1) - (b.sequence || 1));

  // Structures available to copy rules from (excluding this one)
  const availableSourceStructures = allStructures.filter(
    (s) => s.id !== id && (s.rulesCount || s.rules?.length || 0) > 0
  );

  const handleSaveRule = () => {
    if (!ruleFormData.name.trim() || !ruleFormData.code.trim()) {
      toast.error('Please enter both rule name and code.');
      return;
    }

    const payload = {
      name: ruleFormData.name.trim(),
      code: ruleFormData.code.trim().toUpperCase(),
      category: ruleFormData.category,
      calculationType: ruleFormData.calculationType,
      sequence: Number(ruleFormData.sequence) || 1,
      salaryStructureId: id,
      percentage: ruleFormData.calculationType === 'PERCENTAGE' ? Number(ruleFormData.percentage) || null : null,
      value: ruleFormData.calculationType === 'FIXED' ? Number(ruleFormData.value) || null : null,
      formula: ruleFormData.calculationType === 'FORMULA' ? ruleFormData.formula.trim() || null : null,
      active: true,
    };

    if (editingRule) {
      updateRuleMutation.mutate({ ruleId: editingRule.id, data: payload });
    } else {
      createRuleMutation.mutate(payload);
    }
  };

  const handleOpenEdit = (rule, e) => {
    e.stopPropagation();
    setEditingRule(rule);
    setRuleFormData({
      name: rule.name || '',
      code: rule.code || '',
      category: rule.category || 'BASIC',
      calculationType: rule.calculationType || 'PERCENTAGE',
      percentage: rule.percentage != null ? String(rule.percentage) : '50',
      value: rule.value != null ? String(rule.value) : '',
      formula: rule.formula || '',
      sequence: rule.sequence ?? 10,
    });
    setIsAddModalOpen(true);
  };

  const handleDeleteRule = (ruleId, ruleName, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove rule "${ruleName}" from this structure?`)) {
      deleteRuleMutation.mutate(ruleId);
    }
  };

  return (
    <PageContainer
      title={`Salary Structure / ${structure.name}`}
      description="Structure details and associated calculation rules."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.SALARY_STRUCTURES)}>
            Back
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Copy}
            onClick={() => {
              if (availableSourceStructures.length > 0) {
                setSourceStructureId(availableSourceStructures[0].id);
              }
              setIsCopyModalOpen(true);
            }}
          >
            Copy Rules
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setEditingRule(null);
              const nextSeq = sortedRules.length > 0 ? Math.max(...sortedRules.map((r) => r.sequence || 0)) + 5 : 10;
              setRuleFormData({
                name: '',
                code: '',
                category: 'BASIC',
                calculationType: 'PERCENTAGE',
                percentage: '50',
                value: '',
                formula: '',
                sequence: nextSeq,
              });
              setIsAddModalOpen(true);
            }}
          >
            Add Rule
          </Button>
        </div>
      }
    >
      {/* Form Fields Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Structure Name</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#714B67]" />
              {structure.name}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Description</span>
            <span className="text-slate-700 text-xs mt-0.5 block">
              {structure.description || '—'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Total Rules</span>
            <span className="font-bold text-[#714B67] text-sm mt-0.5 block">
              {sortedRules.length} {sortedRules.length === 1 ? 'Rule' : 'Rules'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Status</span>
            <div className="mt-1">
              <StatusBadge status={structure.status || 'ACTIVE'} />
            </div>
          </div>
        </div>
      </div>

      {/* Salary Rules Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Salary Rules ({sortedRules.length})
            </h3>
            <span className="text-[11px] text-slate-400">Rules are computed in ascending sequence order</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="xs"
              icon={Copy}
              onClick={() => {
                if (availableSourceStructures.length > 0) {
                  setSourceStructureId(availableSourceStructures[0].id);
                }
                setIsCopyModalOpen(true);
              }}
            >
              Copy from Structure
            </Button>
            <Button
              variant="primary"
              size="xs"
              icon={Plus}
              onClick={() => {
                setEditingRule(null);
                const nextSeq = sortedRules.length > 0 ? Math.max(...sortedRules.map((r) => r.sequence || 0)) + 5 : 10;
                setRuleFormData({
                  name: '',
                  code: '',
                  category: 'BASIC',
                  calculationType: 'PERCENTAGE',
                  percentage: '50',
                  value: '',
                  formula: '',
                  sequence: nextSeq,
                });
                setIsAddModalOpen(true);
              }}
            >
              Add Rule
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 font-mono text-center w-16">Seq</th>
                <th className="p-3">Rule Name</th>
                <th className="p-3 font-mono">Code</th>
                <th className="p-3">Category</th>
                <th className="p-3">Calculation Type & Value</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRules.length > 0 ? (
                sortedRules.map((rule) => {
                  const cat = (rule.category || '').toUpperCase();
                  const isNet = cat === 'NET';
                  const isGross = cat === 'GROSS';
                  const isDed = cat === 'DED' || cat === 'DEDUCTION' || cat === 'TAX';

                  let calcDisplay = '—';
                  if (rule.calculationType === 'PERCENTAGE') {
                    calcDisplay = `${rule.percentage ?? 0}% of Wage`;
                  } else if (rule.calculationType === 'FIXED') {
                    calcDisplay = `₹${Number(rule.value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                  } else if (rule.calculationType === 'FORMULA') {
                    calcDisplay = rule.formula || 'Python Expression';
                  }

                  return (
                    <tr
                      key={rule.id || rule.code}
                      onClick={() => rule.id && navigate(ROUTES.SALARY_RULE_DETAIL(rule.id))}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="p-3 text-center font-mono font-bold text-slate-700">
                        {rule.sequence ?? 1}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-900 block leading-tight">
                          {rule.name}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-600">
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
                      <td className="p-3 font-medium text-slate-700">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          {rule.calculationType === 'PERCENTAGE' && <Percent className="w-3.5 h-3.5 text-purple-600" />}
                          {rule.calculationType === 'FIXED' && <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />}
                          {rule.calculationType === 'FORMULA' && <Code2 className="w-3.5 h-3.5 text-blue-600" />}
                          <span className="font-mono text-xs">{calcDisplay}</span>
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(rule, e)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Edit Rule"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteRule(rule.id, rule.name, e)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Calculator className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-xs">No salary rules assigned to this structure</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Add custom rules or copy standard rules from another structure to enable payslip computation.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <Button
                          variant="secondary"
                          size="xs"
                          icon={Copy}
                          onClick={() => {
                            if (availableSourceStructures.length > 0) {
                              setSourceStructureId(availableSourceStructures[0].id);
                            }
                            setIsCopyModalOpen(true);
                          }}
                        >
                          Copy from Existing Structure
                        </Button>
                        <Button
                          variant="primary"
                          size="xs"
                          icon={Plus}
                          onClick={() => {
                            setEditingRule(null);
                            setRuleFormData({
                              name: '',
                              code: '',
                              category: 'BASIC',
                              calculationType: 'PERCENTAGE',
                              percentage: '50',
                              value: '',
                              formula: '',
                              sequence: 10,
                            });
                            setIsAddModalOpen(true);
                          }}
                        >
                          Add Rule
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Rule Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRule(null);
        }}
        title={editingRule ? `Edit Rule / ${editingRule.name}` : 'Add Salary Rule to Structure'}
        description="Configure rule code, category, calculation formula, and execution sequence."
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Rule Name" required>
              <Input
                placeholder="e.g. Basic Salary"
                value={ruleFormData.name}
                onChange={(e) => setRuleFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </FormField>

            <FormField label="Rule Code" required helperText="Upper-case variable (e.g. BASIC)">
              <Input
                placeholder="e.g. BASIC"
                value={ruleFormData.code}
                onChange={(e) => setRuleFormData((prev) => ({ ...prev, code: e.target.value }))}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category" required>
              <Select
                options={[
                  { value: 'BASIC', label: 'Basic' },
                  { value: 'ALW', label: 'Allowance' },
                  { value: 'GROSS', label: 'Gross' },
                  { value: 'DED', label: 'Deduction' },
                  { value: 'NET', label: 'Net' },
                ]}
                value={ruleFormData.category}
                onChange={(e) => setRuleFormData((prev) => ({ ...prev, category: e.target.value }))}
              />
            </FormField>

            <FormField label="Sequence" required helperText="Order of computation">
              <Input
                type="number"
                value={ruleFormData.sequence}
                onChange={(e) => setRuleFormData((prev) => ({ ...prev, sequence: e.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Calculation Type" required>
            <Select
              options={[
                { value: 'PERCENTAGE', label: 'Percentage of Wage' },
                { value: 'FIXED', label: 'Fixed Amount (₹)' },
                { value: 'FORMULA', label: 'Python Expression / Formula' },
              ]}
              value={ruleFormData.calculationType}
              onChange={(e) => setRuleFormData((prev) => ({ ...prev, calculationType: e.target.value }))}
            />
          </FormField>

          {ruleFormData.calculationType === 'PERCENTAGE' && (
            <FormField label="Percentage (%)" required helperText="Percent applied to base contract wage">
              <Input
                type="number"
                placeholder="e.g. 50"
                value={ruleFormData.percentage}
                onChange={(e) => setRuleFormData((prev) => ({ ...prev, percentage: e.target.value }))}
              />
            </FormField>
          )}

          {ruleFormData.calculationType === 'FIXED' && (
            <FormField label="Fixed Value (₹)" required helperText="Fixed currency amount per payrun">
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={ruleFormData.value}
                onChange={(e) => setRuleFormData((prev) => ({ ...prev, value: e.target.value }))}
              />
            </FormField>
          )}

          {ruleFormData.calculationType === 'FORMULA' && (
            <FormField label="Formula Expression" required helperText="e.g. BASIC + HRA - PF">
              <Input
                placeholder="e.g. BASIC + HRA + STD"
                value={ruleFormData.formula}
                onChange={(e) => setRuleFormData((prev) => ({ ...prev, formula: e.target.value }))}
              />
            </FormField>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingRule(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={createRuleMutation.isPending || updateRuleMutation.isPending}
              onClick={handleSaveRule}
            >
              {editingRule ? 'Save Changes' : 'Add Rule'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Copy Rules from Structure Modal */}
      <Modal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        title="Copy Rules from Structure"
        description="Clone all salary calculation rules from an existing structure into this structure."
        size="md"
      >
        <div className="space-y-4">
          {availableSourceStructures.length > 0 ? (
            <>
              <FormField label="Source Salary Structure" required>
                <Select
                  options={availableSourceStructures.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.rulesCount || s.rules?.length || 0} rules)`,
                  }))}
                  value={sourceStructureId || availableSourceStructures[0]?.id || ''}
                  onChange={(e) => setSourceStructureId(e.target.value)}
                />
              </FormField>

              {/* Preview of rules to copy */}
              {(() => {
                const src = availableSourceStructures.find((s) => s.id === (sourceStructureId || availableSourceStructures[0]?.id));
                return src && src.rules && src.rules.length > 0 ? (
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 max-h-48 overflow-y-auto space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Rules that will be cloned:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {src.rules.map((r) => (
                        <span
                          key={r.id || r.code}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-white text-slate-700 font-medium border border-slate-200 shadow-2xs"
                        >
                          <span className="font-mono font-bold text-[#714B67]">{r.code}</span>
                          <span>{r.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="secondary" size="sm" onClick={() => setIsCopyModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={copyRulesMutation.isPending}
                  onClick={() => {
                    const srcId = sourceStructureId || availableSourceStructures[0]?.id;
                    if (srcId) {
                      copyRulesMutation.mutate(srcId);
                    }
                  }}
                >
                  Clone Rules Now
                </Button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center text-slate-500">
              <p className="text-xs">No other structures with rules are available to copy from.</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => setIsCopyModalOpen(false)}>
                Close
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </PageContainer>
  );
}
