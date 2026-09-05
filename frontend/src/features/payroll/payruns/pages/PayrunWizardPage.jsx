import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/form/FormField';
import { Input } from '@/components/form/Input';
import { Select } from '@/components/form/Select';
import { Checkbox } from '@/components/form/Checkbox';
import { StatusBadge } from '@/components/badge/StatusBadge';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/lib/utils/formatters';
import { ROUTES } from '@/config/routes';
import {
  Calendar,
  Layers,
  Users,
  Eye,
  Calculator,
  ShieldCheck,
  CreditCard,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const STEPS = [
  { step: 1, title: 'Period', icon: Calendar },
  { step: 2, title: 'Structure', icon: Layers },
  { step: 3, title: 'Employees', icon: Users },
  { step: 4, title: 'Review', icon: Eye },
  { step: 5, title: 'Calculate', icon: Calculator },
  { step: 6, title: 'Validate', icon: ShieldCheck },
  { step: 7, title: 'Mark Paid', icon: CreditCard },
  { step: 8, title: 'Deliver', icon: Send },
];

const SAMPLE_STAFF = [
  { id: 'e1', name: 'Sarah Connor', code: 'EMP-001', dept: 'Engineering', wage: 6500, bankOk: true },
  { id: 'e2', name: 'Michael Scott', code: 'EMP-002', dept: 'Management', wage: 8200, bankOk: true },
  { id: 'e3', name: 'Dwight Schrute', code: 'EMP-003', dept: 'Sales', wage: 5400, bankOk: true },
  { id: 'e4', name: 'Pam Beesly', code: 'EMP-004', dept: 'Human Resources', wage: 4200, bankOk: false },
  { id: 'e5', name: 'Jim Halpert', code: 'EMP-005', dept: 'Sales', wage: 5200, bankOk: true },
  { id: 'e6', name: 'Alex Vance', code: 'EMP-006', dept: 'Engineering', wage: 4800, bankOk: true },
];

export function PayrunWizardPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [periodStart, setPeriodStart] = useState('2026-10-01');
  const [periodEnd, setPeriodEnd] = useState('2026-10-31');
  const [structure, setStructure] = useState('Regular Full-Time');
  const [selectedEmployees, setSelectedEmployees] = useState(SAMPLE_STAFF.map((s) => s.id));
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isDelivered, setIsDelivered] = useState(false);

  // Toggle single employee
  const toggleEmployee = (id) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle all
  const toggleAll = () => {
    if (selectedEmployees.length === SAMPLE_STAFF.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(SAMPLE_STAFF.map((s) => s.id));
    }
  };

  // Step 5: Calculation Trigger
  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      setIsCalculated(true);
      toast.success('Payroll numbers calculated successfully for all selected staff.');
    }, 1200);
  };

  const selectedCount = selectedEmployees.length;
  const grossTotal = selectedCount * 5716;
  const deductionsTotal = selectedCount * 857;
  const netTotal = grossTotal - deductionsTotal;

  return (
    <PageContainer
      title="Create New Payrun"
      description="8-Step automated payroll lifecycle and compliance wizard."
      actions={
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.PAYRUNS)}>
          Cancel
        </Button>
      }
    >
      {/* 8-Step Stepper Header */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px]">
          {STEPS.map((s, idx) => {
            const isDone = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <React.Fragment key={s.step}>
                <div
                  className="flex items-center gap-2 cursor-pointer select-none"
                  onClick={() => s.step < currentStep && setCurrentStep(s.step)}
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                      isDone && 'bg-emerald-600 text-white',
                      isCurrent && 'bg-[#714B67] text-white ring-4 ring-[#714B67]/15',
                      !isDone && !isCurrent && 'bg-slate-100 text-slate-400'
                    )}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium whitespace-nowrap',
                      isCurrent ? 'font-bold text-[#714B67]' : isDone ? 'text-slate-700' : 'text-slate-400'
                    )}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2',
                      isDone ? 'bg-emerald-500' : 'bg-slate-200'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Contents */}
      <div className="space-y-4">
        {/* STEP 1: Payroll Period */}
        {currentStep === 1 && (
          <Card>
            <CardHeader
              title="Step 1: Set Payroll Period"
              subtitle="Choose the starting and ending dates for wage accrual"
            />
            <CardContent className="p-5 max-w-lg space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Period Start Date" required>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </FormField>
                <FormField label="Period End Date" required>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </FormField>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
                Default schedule cycle configured as <strong>Monthly Standard (30 Days)</strong>.
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Salary Structure */}
        {currentStep === 2 && (
          <Card>
            <CardHeader
              title="Step 2: Assign Salary Structure"
              subtitle="Select which computational template applies to this batch"
            />
            <CardContent className="p-5 max-w-lg space-y-4">
              <FormField label="Salary Blueprint" required>
                <Select
                  options={[
                    'Regular Full-Time',
                    'Executive Management',
                    'Sales Commission Base',
                    'Hourly Contractor',
                  ]}
                  value={structure}
                  onChange={(e) => setStructure(e.target.value)}
                />
              </FormField>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 text-slate-600">
                <p className="font-semibold text-slate-800">Assigned Rules (7):</p>
                <p className="font-mono text-[11px] text-[#714B67]">
                  BASIC (50%) + HRA (25%) + TRANS ($300) - TAX (10%) - PF (5%) = NET
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Select Employees */}
        {currentStep === 3 && (
          <Card>
            <CardHeader
              title="Step 3: Select Eligible Employees"
              subtitle="Choose which personnel to calculate payslips for"
              action={
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="xs" onClick={toggleAll}>
                    {selectedEmployees.length === SAMPLE_STAFF.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <span className="text-xs font-semibold text-slate-600">
                    {selectedCount} of {SAMPLE_STAFF.length} selected
                  </span>
                </div>
              }
            />
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {SAMPLE_STAFF.map((staff) => (
                  <div
                    key={staff.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer"
                    onClick={() => toggleEmployee(staff.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedEmployees.includes(staff.id)}
                        onChange={() => toggleEmployee(staff.id)}
                      />
                      <div>
                        <span className="font-semibold text-xs text-slate-800 block leading-tight">
                          {staff.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {staff.code} • {staff.dept}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-xs text-slate-900">
                      {formatCurrency(staff.wage)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Review */}
        {currentStep === 4 && (
          <Card>
            <CardHeader
              title="Step 4: Pre-Calculation Review"
              subtitle="Verify batch parameters before triggering formula calculations"
            />
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Period</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">
                    {periodStart} – {periodEnd}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Structure</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">{structure}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Headcount</span>
                  <span className="text-xs font-bold text-[#714B67] mt-1 block">
                    {selectedCount} Employees Enrolled
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                Ready to compile. Click <strong>Proceed to Calculate</strong> to run formula computation.
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 5: Calculate */}
        {currentStep === 5 && (
          <Card>
            <CardHeader
              title="Step 5: Automated Formula Calculation"
              subtitle="Evaluating gross, allowances, deductions, and net amounts"
            />
            <CardContent className="p-6 space-y-5">
              {!isCalculated ? (
                <div className="text-center py-8 space-y-3">
                  <Calculator className="w-12 h-12 text-[#714B67] mx-auto opacity-70 animate-pulse" />
                  <h4 className="text-sm font-semibold text-slate-800">
                    Ready to evaluate salary structures
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Rules will calculate Basic, HRA, Transport allowances, and statutory taxes.
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleCalculate}
                    isLoading={isCalculating}
                  >
                    Execute Calculation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Calculations complete for {selectedCount} employees with zero syntax errors.
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Gross Total</span>
                      <span className="text-lg font-bold text-slate-900 mt-1 block">{formatCurrency(grossTotal)}</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Deductions</span>
                      <span className="text-lg font-bold text-rose-600 mt-1 block">-{formatCurrency(deductionsTotal)}</span>
                    </div>
                    <div className="p-3.5 bg-[#714B67]/10 rounded-lg border border-[#714B67]/20">
                      <span className="text-[10px] text-[#714B67] font-semibold uppercase block">Total Net Payout</span>
                      <span className="text-lg font-bold text-[#714B67] mt-1 block">{formatCurrency(netTotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 6: Validate */}
        {currentStep === 6 && (
          <Card>
            <CardHeader
              title="Step 6: Pre-Disbursement Payroll Validation"
              subtitle="Automated audits against banking profiles, contracts, and attendance anomalies"
            />
            <CardContent className="p-5 space-y-4">
              <div className="space-y-3">
                {/* Warning 1 */}
                <div className="p-3.5 rounded-lg border bg-amber-50/60 border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Warning: Missing Direct Deposit Profile</span>
                    <p className="mt-0.5 text-amber-800">
                      Pam Beesly (EMP-004) has an unconfirmed IFSC code. A physical paper check will be generated automatically.
                    </p>
                  </div>
                </div>

                {/* Passed item */}
                <div className="p-3.5 rounded-lg border bg-emerald-50/60 border-emerald-200 flex items-start gap-3 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Contract Verification Passed</span>
                    <p className="mt-0.5 text-emerald-800">
                      All {selectedCount} selected employees hold an active, non-expired contract in the system.
                    </p>
                  </div>
                </div>

                {/* Passed item 2 */}
                <div className="p-3.5 rounded-lg border bg-emerald-50/60 border-emerald-200 flex items-start gap-3 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Tax Withholding Compliance Checked</span>
                    <p className="mt-0.5 text-emerald-800">
                      Standard federal and state brackets validated against 2026 guidelines.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 7: Mark Paid */}
        {currentStep === 7 && (
          <Card>
            <CardHeader
              title="Step 7: Authorize Batch Disbursement"
              subtitle="Confirm bank file transfer and lock payrun against further modifications"
            />
            <CardContent className="p-6 space-y-4 text-center">
              {!isPaid ? (
                <div className="max-w-md mx-auto space-y-4">
                  <CreditCard className="w-12 h-12 text-slate-400 mx-auto" />
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Authorize Payout of {formatCurrency(netTotal)}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      This action will update all payslip statuses to PAID and log an immutable audit transaction.
                    </p>
                  </div>
                  <Button
                    variant="success"
                    size="md"
                    className="w-full"
                    onClick={() => {
                      setIsPaid(true);
                      toast.success(`Disbursement of ${formatCurrency(netTotal)} marked as PAID.`);
                    }}
                  >
                    Confirm & Mark Paid
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Batch authorized. Status updated to PAID.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 8: Generate & Deliver Payslips */}
        {currentStep === 8 && (
          <Card>
            <CardHeader
              title="Step 8: Generate & Deliver Payslips"
              subtitle="Bulk compile PDF files and send automated email receipts"
            />
            <CardContent className="p-6 text-center space-y-4">
              {!isDelivered ? (
                <div className="max-w-md mx-auto space-y-4">
                  <Send className="w-12 h-12 text-[#714B67] mx-auto" />
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Send Payslips to {selectedCount} Employees?
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Automated background job will queue PDF compilation and dispatch to each registered employee email address.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={() => {
                      setIsDelivered(true);
                      toast.success(`Queued PDF payslip delivery for ${selectedCount} employees.`);
                    }}
                  >
                    Send Payslips Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-semibold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    All payslips successfully dispatched to employees!
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(ROUTES.PAYRUNS)}
                  >
                    Return to Payruns List
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Previous
          </Button>

          {currentStep < 8 && (
            <Button
              variant="primary"
              size="sm"
              disabled={currentStep === 5 && !isCalculated}
              onClick={() => setCurrentStep((prev) => Math.min(prev + 1, 8))}
            >
              Continue to Step {currentStep + 1}
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
