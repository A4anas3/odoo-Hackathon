import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/form/FormField';
import { Input } from '@/components/form/Input';
import { Select } from '@/components/form/Select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salaryRuleApi } from '../api/salaryRuleApi';
import { salaryStructureApi } from '@/features/salary/structures/api/salaryStructureApi';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/config/routes';
import { ArrowLeft, Edit3, Save, Info, Calculator, Code2, Percent, IndianRupee } from 'lucide-react';
import { Spinner } from '@/components/loading/Spinner';

export function SalaryRuleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('PERCENTAGE'); // 'FIXED', 'PERCENTAGE', 'PYTHON'

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'BASIC',
    sequence: 1,
    salaryStructureId: '',
    calculationType: 'PERCENTAGE',
    percentage: '50',
    quantity: '1',
    value: '',
    formula: 'result = contract.wage * 0.5',
    active: true,
  });

  const { data: rule, isLoading: isRuleLoading } = useQuery({
    queryKey: ['salaryRules', id],
    queryFn: () => salaryRuleApi.getRuleById(id),
  });

  const { data: structures = [], isLoading: isStructuresLoading } = useQuery({
    queryKey: ['salaryStructures'],
    queryFn: () => salaryStructureApi.getAllStructures(),
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        code: rule.code || '',
        category: rule.category || 'BASIC',
        sequence: rule.sequence ?? 1,
        salaryStructureId: rule.salaryStructureId || rule.salaryStructure?.id || '',
        calculationType: rule.calculationType || 'PERCENTAGE',
        percentage: rule.percentage != null ? String(rule.percentage) : '50',
        quantity: '1',
        value: rule.value != null ? String(rule.value) : '',
        formula: rule.formula || 'result = contract.wage * 0.5',
        active: rule.active !== false,
      });

      if (rule.calculationType === 'FIXED') {
        setActiveTab('FIXED');
      } else if (rule.calculationType === 'FORMULA') {
        setActiveTab('PYTHON');
      } else {
        setActiveTab('PERCENTAGE');
      }
    }
  }, [rule]);

  const updateMutation = useMutation({
    mutationFn: (data) => salaryRuleApi.updateRule(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['salaryRules', id] });
      queryClient.invalidateQueries({ queryKey: ['salaryRules'] });
      setIsEditing(false);
      toast.success(`Salary rule "${updated.name || 'Rule'}" updated successfully.`);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to update rule.');
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      name: formData.name,
      code: formData.code.toUpperCase(),
      category: formData.category,
      sequence: Number(formData.sequence) || 1,
      salaryStructureId: formData.salaryStructureId || null,
      calculationType: activeTab === 'FIXED' ? 'FIXED' : activeTab === 'PYTHON' ? 'FORMULA' : 'PERCENTAGE',
      percentage: activeTab === 'PERCENTAGE' ? Number(formData.percentage) : null,
      value: activeTab === 'FIXED' ? Number(formData.value) : null,
      formula: activeTab === 'PYTHON' ? formData.formula : null,
      active: formData.active,
    });
  };

  if (isRuleLoading || isStructuresLoading) {
    return (
      <PageContainer title="Salary Rule">
        <div className="py-24 flex justify-center">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (!rule) {
    return (
      <PageContainer title="Salary Rule">
        <div className="py-16 text-center text-slate-500">
          <p className="font-semibold text-sm">Salary rule not found.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate(ROUTES.SALARY_RULES)}>
            Back to Rules
          </Button>
        </div>
      </PageContainer>
    );
  }

  const structureName = structures.find((s) => s.id === formData.salaryStructureId)?.name || rule.salaryStructureName || 'Regular Salary';

  return (
    <PageContainer
      title={`Salary Rule / ${formData.name || 'Basic Salary'}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.SALARY_RULES)}>
            Back
          </Button>

          {isEditing ? (
            <Button
              variant="primary"
              size="sm"
              icon={Save}
              isLoading={updateMutation.isPending}
              onClick={handleSave}
            >
              SAVE
            </Button>
          ) : (
            <Button variant="secondary" size="sm" icon={Edit3} onClick={() => setIsEditing(true)}>
              EDIT
            </Button>
          )}
        </div>
      }
    >
      {/* Form Fields Card (Matches Wireframe 5 Form View) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField label="Rule Name" required>
            <Input
              disabled={!isEditing}
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
          </FormField>

          <FormField label="Code" required helperText="Variable token code">
            <Input
              disabled={!isEditing}
              className="font-mono uppercase font-bold"
              value={formData.code}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
            />
          </FormField>

          <FormField label="Category">
            {isEditing ? (
              <Select
                options={[
                  { value: 'BASIC', label: 'Basic' },
                  { value: 'ALLOWANCE', label: 'Allowance' },
                  { value: 'GROSS', label: 'Gross' },
                  { value: 'DEDUCTION', label: 'Deduction' },
                  { value: 'NET', label: 'Net' },
                ]}
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              />
            ) : (
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-800">
                {formData.category}
              </div>
            )}
          </FormField>

          <FormField label="Sequence">
            <Input
              type="number"
              disabled={!isEditing}
              value={formData.sequence}
              onChange={(e) => setFormData((prev) => ({ ...prev, sequence: e.target.value }))}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField label="Salary Structure">
            {isEditing ? (
              <Select
                options={structures.map((s) => ({ value: s.id, label: s.name }))}
                value={formData.salaryStructureId}
                onChange={(e) => setFormData((prev) => ({ ...prev, salaryStructureId: e.target.value }))}
              />
            ) : (
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-800">
                {structureName}
              </div>
            )}
          </FormField>

          <FormField label="Computation">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-800">
              {activeTab === 'PERCENTAGE' ? 'Percentage of wage' : activeTab === 'FIXED' ? 'Fixed amount' : 'Python Code / Formula'}
            </div>
          </FormField>

          <FormField label="Percentage">
            <Input
              type="number"
              disabled={!isEditing || activeTab !== 'PERCENTAGE'}
              value={formData.percentage}
              onChange={(e) => setFormData((prev) => ({ ...prev, percentage: e.target.value }))}
            />
          </FormField>

          <FormField label="Quantity">
            <Input
              type="number"
              disabled={!isEditing}
              value={formData.quantity}
              onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
            />
          </FormField>
        </div>
      </div>

      {/* Computation Options Section (Matches Wireframe 5 Form View Tabs) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/50 px-4 pt-3 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Computation options (one method)
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => isEditing && setActiveTab('FIXED')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'FIXED'
                  ? 'border-[#714B67] text-[#714B67] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Fixed Amount</span>
            </button>
            <button
              type="button"
              onClick={() => isEditing && setActiveTab('PERCENTAGE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'PERCENTAGE'
                  ? 'border-[#714B67] text-[#714B67] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Percentage of Wage</span>
            </button>
            <button
              type="button"
              onClick={() => isEditing && setActiveTab('PYTHON')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'PYTHON'
                  ? 'border-[#714B67] text-[#714B67] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Python Code</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'FIXED' && (
            <div className="max-w-md space-y-3">
              <FormField label="Fixed Amount Value (₹)" helperText="Exact monetary value entered in the rule (e.g. 5,000)">
                <Input
                  type="number"
                  disabled={!isEditing}
                  placeholder="5000"
                  value={formData.value}
                  onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
                />
              </FormField>
              <p className="text-xs text-slate-500 italic">
                Fixed Amount method uses the exact value entered here for every applicable payslip.
              </p>
            </div>
          )}

          {activeTab === 'PERCENTAGE' && (
            <div className="max-w-lg space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Percentage of Base (%)">
                  <Input
                    type="number"
                    disabled={!isEditing}
                    placeholder="50"
                    value={formData.percentage}
                    onChange={(e) => setFormData((prev) => ({ ...prev, percentage: e.target.value }))}
                  />
                </FormField>
                <FormField label="Base Source">
                  <Select
                    options={[
                      { value: 'wage', label: 'Contract Wage' },
                      { value: 'basic', label: 'Basic Salary' },
                      { value: 'gross', label: 'Gross Salary' },
                    ]}
                    value="wage"
                    disabled={!isEditing}
                    onChange={() => {}}
                  />
                </FormField>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
                Formula preview: result = contract.wage * ({formData.percentage || 0} / 100)
              </div>
            </div>
          )}

          {activeTab === 'PYTHON' && (
            <div className="space-y-3">
              <FormField label="Python Code / Formula Expression" helperText="Evaluate complex formulas with tokens: contract.wage, BASIC, HRA, GROSS, etc.">
                <textarea
                  disabled={!isEditing}
                  rows={4}
                  value={formData.formula}
                  onChange={(e) => setFormData((prev) => ({ ...prev, formula: e.target.value }))}
                  className="w-full font-mono text-xs p-3 bg-slate-900 text-emerald-400 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                  placeholder="result = contract.wage * 0.5"
                />
              </FormField>
              <p className="text-xs text-slate-500">
                Python Code / Formula is used for advanced calculations where fixed or percentage methods are not sufficient, such as attendance-based salary, overtime, or multi-token rule cascades.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
