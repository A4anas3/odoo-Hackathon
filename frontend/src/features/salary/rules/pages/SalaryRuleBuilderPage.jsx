import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { DataTable } from '@/components/table/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/modal/Modal';
import { FormField } from '@/components/form/FormField';
import { Input } from '@/components/form/Input';
import { Select } from '@/components/form/Select';
import { useToast } from '@/hooks/useToast';
import { Calculator, Plus, HelpCircle, Check, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const INITIAL_RULES = [
  {
    id: 'rule-01',
    sequence: 1,
    name: 'Basic Salary',
    code: 'BASIC',
    category: 'BASIC',
    calculationType: 'PERCENTAGE',
    percentage: 50,
    formula: 'contract.wage * 0.50',
    description: '50% of the contractual monthly base wage',
  },
  {
    id: 'rule-02',
    sequence: 2,
    name: 'House Rent Allowance (HRA)',
    code: 'HRA',
    category: 'ALLOWANCE',
    calculationType: 'PERCENTAGE',
    percentage: 25,
    formula: 'contract.wage * 0.25',
    description: 'Housing assistance calculated at 25% of base wage',
  },
  {
    id: 'rule-03',
    sequence: 3,
    name: 'Standard Transport Allowance',
    code: 'TRANS',
    category: 'ALLOWANCE',
    calculationType: 'FIXED',
    fixedAmount: 300,
    formula: '300.00',
    description: 'Fixed monthly conveyance allowance',
  },
  {
    id: 'rule-04',
    sequence: 4,
    name: 'Gross Pay Computation',
    code: 'GROSS',
    category: 'GROSS',
    calculationType: 'FORMULA',
    formula: 'BASIC + HRA + TRANS',
    description: 'Sum total of base earnings and active allowances',
  },
  {
    id: 'rule-05',
    sequence: 5,
    name: 'Income Tax Withholding',
    code: 'TAX',
    category: 'DEDUCTION',
    calculationType: 'PERCENTAGE',
    percentage: 10,
    formula: 'GROSS * 0.10',
    description: 'Estimated standard income tax deduction at 10%',
  },
  {
    id: 'rule-06',
    sequence: 6,
    name: 'Provident Fund (PF)',
    code: 'PF',
    category: 'DEDUCTION',
    calculationType: 'PERCENTAGE',
    percentage: 5,
    formula: 'BASIC * 0.05',
    description: 'Retirement savings contribution at 5% of Basic',
  },
  {
    id: 'rule-07',
    sequence: 7,
    name: 'Net Salary',
    code: 'NET',
    category: 'NET',
    calculationType: 'FORMULA',
    formula: 'GROSS - TAX - PF',
    description: 'Take-home compensation disbursed to employee bank account',
  },
];

const CATEGORY_COLORS = {
  BASIC: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ALLOWANCE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  GROSS: 'bg-blue-50 text-blue-700 border-blue-200',
  DEDUCTION: 'bg-rose-50 text-rose-700 border-rose-200',
  NET: 'bg-purple-50 text-purple-700 border-purple-200 font-bold',
};

export function SalaryRuleBuilderPage() {
  const toast = useToast();
  const [rules, setRules] = useState(INITIAL_RULES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    code: '',
    sequence: 8,
    category: 'ALLOWANCE',
    calculationType: 'FIXED',
    amount: '',
    formula: '',
  });

  const handleAddRule = () => {
    if (!newRule.name || !newRule.code) {
      toast.error('Please enter rule name and code.');
      return;
    }
    const created = {
      id: `rule-${Date.now()}`,
      sequence: Number(newRule.sequence) || rules.length + 1,
      name: newRule.name,
      code: newRule.code.toUpperCase(),
      category: newRule.category,
      calculationType: newRule.calculationType,
      formula: newRule.calculationType === 'FORMULA' ? newRule.formula : `${newRule.amount}`,
      description: `Custom calculated ${newRule.category.toLowerCase()}`,
    };
    setRules([...rules, created]);
    setIsModalOpen(false);
    toast.success(`Salary rule ${created.name} added to execution chain.`);
  };

  const columns = [
    {
      header: 'Seq',
      key: 'sequence',
      width: '60px',
      render: (seq) => (
        <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-mono font-bold text-slate-600 text-[11px]">
          {seq}
        </span>
      ),
    },
    {
      header: 'Rule Name',
      key: 'name',
      render: (name, row) => (
        <div>
          <span className="font-semibold text-slate-800 block">{name}</span>
          <span className="text-[11px] text-slate-400 font-mono">{row.code}</span>
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
            CATEGORY_COLORS[cat] || 'bg-slate-100 text-slate-600'
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
          {type}
        </span>
      ),
    },
    {
      header: 'Computation Logic / Formula',
      key: 'formula',
      render: (formula, row) => (
        <div className="font-mono text-[11px] text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100 max-w-sm truncate">
          {formula}
        </div>
      ),
    },
    {
      header: 'Description',
      key: 'description',
      render: (desc) => <span className="text-slate-500 text-xs">{desc}</span>,
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
      <div className="bg-[#714B67]/5 border border-[#714B67]/20 rounded-lg p-3.5 flex items-center gap-3 text-xs text-[#714B67]">
        <Calculator className="w-4 h-4 shrink-0" />
        <div>
          <span className="font-semibold">Execution Pipeline: </span>
          Rules are evaluated strictly by sequence. Net salary is computed automatically after all earnings and deductions are resolved.
        </div>
      </div>

      <DataTable columns={columns} data={rules} />

      {/* New Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Salary Rule"
        subtitle="Define dynamic salary computation logic"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Rule Name" required>
              <Input
                placeholder="e.g. Remote Stipend"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              />
            </FormField>
            <FormField label="Rule Code" required helperText="Variable code (e.g. REMOTE)">
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
                options={['ALLOWANCE', 'DEDUCTION', 'BASIC', 'GROSS', 'NET']}
                value={newRule.category}
                onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
              />
            </FormField>
            <FormField label="Calculation">
              <Select
                options={['FIXED', 'PERCENTAGE', 'FORMULA']}
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
                value={newRule.amount}
                onChange={(e) => setNewRule({ ...newRule, amount: e.target.value })}
              />
            </FormField>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddRule}>
              Save Rule
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
