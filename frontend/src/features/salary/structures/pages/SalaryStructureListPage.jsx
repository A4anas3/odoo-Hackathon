import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { StatusBadge } from '@/components/badge/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/modal/Modal';
import { FormField } from '@/components/form/FormField';
import { Input } from '@/components/form/Input';
import { Select } from '@/components/form/Select';
import { Layers, Plus, Search, Info, Users, Copy, CheckSquare, Square, Check } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salaryStructureApi } from '../api/salaryStructureApi';
import { salaryRuleApi } from '@/features/salary/rules/api/salaryRuleApi';
import { useToast } from '@/hooks/useToast';

export function SalaryStructureListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Structure Rules configuration option in modal
  const [ruleOption, setRuleOption] = useState('TEMPLATE'); // 'TEMPLATE' | 'SELECT' | 'EMPTY'
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedRuleIds, setSelectedRuleIds] = useState([]);

  const { data: structures = [], isLoading } = useQuery({
    queryKey: ['salaryStructures'],
    queryFn: () => salaryStructureApi.getAllStructures(),
  });

  const { data: allRules = [] } = useQuery({
    queryKey: ['salaryRules'],
    queryFn: () => salaryRuleApi.getAllRules(),
  });

  // Default template structure to first one with rules
  const templateStructures = structures.filter((s) => (s.rulesCount || s.rules?.length || 0) > 0);
  const activeTemplate = templateStructures.find((s) => s.id === selectedTemplateId) || templateStructures[0];

  const createMutation = useMutation({
    mutationFn: (data) => salaryStructureApi.createStructure(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['salaryStructures'] });
      queryClient.invalidateQueries({ queryKey: ['salaryRules'] });
      toast.success(`Salary structure "${created.name || formData.name}" created successfully.`);
      setIsModalOpen(false);
      setFormData({ name: '', description: '' });
      setSelectedRuleIds([]);
      if (created?.id) {
        navigate(ROUTES.SALARY_STRUCTURE_DETAIL(created.id));
      }
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
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      status: 'ACTIVE',
    };

    if (ruleOption === 'TEMPLATE') {
      const templateId = selectedTemplateId || activeTemplate?.id;
      if (templateId) {
        payload.copyFromStructureId = templateId;
      }
    } else if (ruleOption === 'SELECT' && selectedRuleIds.length > 0) {
      payload.ruleIds = selectedRuleIds;
    }

    createMutation.mutate(payload);
  };

  const toggleRuleSelection = (ruleId) => {
    setSelectedRuleIds((prev) =>
      prev.includes(ruleId) ? prev.filter((id) => id !== ruleId) : [...prev, ruleId]
    );
  };

  const filtered = structures.filter((s) => {
    if (!search) return true;
    return s.name.toLowerCase().includes(search.toLowerCase()) || (s.description || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <PageContainer
      title="Salary Structures"
      description="List view."
      actions={
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          NEW
        </Button>
      }
    >
      {/* Search Header Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200/90 flex items-center justify-between gap-3 shadow-2xs">
        <div className="w-full sm:w-80 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search structures..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#714B67] transition-all"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing {filtered.length} structure{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Salary Structures Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Structure Name</th>
                <th className="p-3">Rules</th>
                <th className="p-3">Employees</th>
                <th className="p-3 text-center">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((row) => {
                  const rulesCount = row.rules?.length ?? row.rulesCount ?? 0;
                  const empCount = row.employeeCount ?? 0;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => navigate(ROUTES.SALARY_STRUCTURE_DETAIL(row.id))}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#714B67]/10 flex items-center justify-center text-[#714B67] shrink-0">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block leading-tight">{row.name}</span>
                            <span className="text-[11px] text-slate-400 line-clamp-1">{row.description || 'Standard Structure'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-700 font-mono font-medium">
                        {rulesCount} rules
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {empCount} {empCount === 1 ? 'employee' : 'employees'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <StatusBadge status={row.status || 'ACTIVE'} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    No salary structures found. Click "NEW" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Structure Modal with Structure Rules Configuration */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Salary Structure"
        description="Configure a new salary structure and assign salary calculation rules."
        size="lg"
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
              placeholder="e.g. Standard monthly salary computation for regular employees"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </FormField>

          {/* Structure Rules Option Section */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#714B67]" />
                Structure Rules Option
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {ruleOption === 'TEMPLATE'
                  ? `${activeTemplate?.rules?.length || activeTemplate?.rulesCount || 0} rules will be copied`
                  : ruleOption === 'SELECT'
                  ? `${selectedRuleIds.length} rule(s) selected`
                  : 'Start with 0 rules'}
              </span>
            </div>

            {/* Selection Mode Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRuleOption('TEMPLATE')}
                className={`px-2.5 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                  ruleOption === 'TEMPLATE'
                    ? 'bg-white border-[#714B67] text-[#714B67] shadow-xs'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Copy from Template
              </button>
              <button
                type="button"
                onClick={() => setRuleOption('SELECT')}
                className={`px-2.5 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                  ruleOption === 'SELECT'
                    ? 'bg-white border-[#714B67] text-[#714B67] shadow-xs'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Select Specific Rules
              </button>
              <button
                type="button"
                onClick={() => setRuleOption('EMPTY')}
                className={`px-2.5 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                  ruleOption === 'EMPTY'
                    ? 'bg-white border-[#714B67] text-[#714B67] shadow-xs'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Empty (Add Later)
              </button>
            </div>

            {/* Mode 1: Copy from Template Structure */}
            {ruleOption === 'TEMPLATE' && (
              <div className="space-y-2.5 pt-1">
                <FormField label="Base Structure Template">
                  <Select
                    options={templateStructures.map((s) => ({
                      value: s.id,
                      label: `${s.name} (${s.rulesCount || s.rules?.length || 0} rules)`,
                    }))}
                    value={selectedTemplateId || activeTemplate?.id || ''}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                  />
                </FormField>

                {/* Preview of rules that will be copied */}
                {activeTemplate?.rules && activeTemplate.rules.length > 0 ? (
                  <div className="bg-white rounded-lg p-2.5 border border-slate-200 max-h-36 overflow-y-auto space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Rules in this template:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeTemplate.rules.map((r) => (
                        <span
                          key={r.id || r.code}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium border border-slate-200"
                        >
                          <span className="font-mono font-bold text-[#714B67]">{r.code}</span>
                          <span>{r.name}</span>
                          <span className="text-[9px] text-slate-400 uppercase">({r.category})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Rules from the chosen structure will be duplicated and attached to this new structure.
                  </p>
                )}
              </div>
            )}

            {/* Mode 2: Multi-select Specific Rules */}
            {ruleOption === 'SELECT' && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Check the rules you want to include:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedRuleIds.length === allRules.length) {
                        setSelectedRuleIds([]);
                      } else {
                        setSelectedRuleIds(allRules.map((r) => r.id));
                      }
                    }}
                    className="text-[#714B67] hover:underline font-semibold"
                  >
                    {selectedRuleIds.length === allRules.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-200 max-h-48 overflow-y-auto space-y-1 divide-y divide-slate-100">
                  {allRules.map((rule) => {
                    const isSelected = selectedRuleIds.includes(rule.id);
                    return (
                      <div
                        key={rule.id}
                        onClick={() => toggleRuleSelection(rule.id)}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#714B67]/5' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-[#714B67] border-[#714B67] text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 text-xs">{rule.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono ml-2">[{rule.code}]</span>
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                          {rule.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mode 3: Empty */}
            {ruleOption === 'EMPTY' && (
              <p className="text-xs text-slate-500 italic p-2 bg-white rounded border border-slate-200">
                You can create the structure now and add custom salary rules directly from the structure detail view.
              </p>
            )}
          </div>

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
