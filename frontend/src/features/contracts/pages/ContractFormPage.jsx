import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { FormField } from '../../../components/form/FormField';
import { Input } from '../../../components/form/Input';
import { Select } from '../../../components/form/Select';
import { contractApi } from '../api/contractApi';
import { scheduleApi } from '../../schedules/api/scheduleApi';
import { apiClient } from '../../../lib/api/client';
import { useEmployees } from '../../employees/hooks/useEmployees';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency } from '../../../lib/utils/formatters';
import { ROUTES } from '../../../config/routes';
import { ArrowLeft, Save, History, CheckCircle2 } from 'lucide-react';

export function ContractFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employeeId');
  const toast = useToast();

  const { data: employees = [] } = useEmployees();

  // Query salary structures from backend
  const { data: structures = [] } = useQuery({
    queryKey: ['salary-structures'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/salary/structures');
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        return [];
      }
    },
  });

  // Query working schedules from backend
  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules'],
    queryFn: scheduleApi.getAllSchedules,
  });

  const [formData, setFormData] = useState({
    employeeId: employeeIdParam || '',
    contractType: 'PERMANENT',
    wageType: 'MONTHLY',
    wage: 50000,
    salaryStructureId: '',
    workingScheduleId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'RUNNING',
  });

  // Query existing contracts for the selected employee to detect existing running contract
  const { data: employeeContracts = [] } = useQuery({
    queryKey: ['contracts', 'employee', formData.employeeId],
    queryFn: () => contractApi.getContractsByEmployeeId(formData.employeeId),
    enabled: !!formData.employeeId,
  });

  const activeExistingContract = employeeContracts.find(
    (c) => (c.status || '').toUpperCase() === 'RUNNING' || (c.status || '').toUpperCase() === 'ACTIVE'
  );

  useEffect(() => {
    if (employeeIdParam) {
      setFormData((prev) => ({ ...prev, employeeId: employeeIdParam }));
    }
  }, [employeeIdParam]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default structure and schedule when loaded
  useEffect(() => {
    if (!formData.salaryStructureId && structures.length > 0) {
      setFormData((prev) => ({ ...prev, salaryStructureId: structures[0].id }));
    }
  }, [structures]);

  useEffect(() => {
    if (!formData.workingScheduleId && schedules.length > 0) {
      setFormData((prev) => ({ ...prev, workingScheduleId: schedules[0].id }));
    }
  }, [schedules]);

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: `${emp.firstName} ${emp.lastName || ''} (${emp.employeeCode || 'No code'})`.trim(),
  }));

  const structureOptions = structures.map((st) => ({
    value: st.id,
    label: st.name,
  }));

  const scheduleOptions = schedules.map((sc) => ({
    value: sc.id,
    label: `${sc.name} (${sc.hoursPerWeek ? `${sc.hoursPerWeek}h/wk` : ''})`.trim(),
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId) {
      toast.error('Please select an employee.');
      return;
    }
    if (!formData.wage || Number(formData.wage) <= 0) {
      toast.error('Please enter a valid compensation wage.');
      return;
    }
    if (!formData.startDate) {
      toast.error('Please specify a contract start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await contractApi.createContract({
        employeeId: formData.employeeId,
        contractType: formData.contractType || 'PERMANENT',
        wageType: formData.wageType || 'MONTHLY',
        salary: Number(formData.wage),
        salaryStructureId: formData.salaryStructureId || null,
        workingScheduleId: formData.workingScheduleId || null,
        startDate: formData.startDate,
        endDate: formData.endDate ? formData.endDate : null,
        status: formData.status || 'RUNNING',
      });
      toast.success(
        activeExistingContract
          ? 'New contract activated. Previous contract archived in history.'
          : 'Contract agreement created successfully.'
      );
      if (employeeIdParam) {
        navigate(ROUTES.EMPLOYEE_DETAIL(formData.employeeId));
      } else {
        navigate(ROUTES.CONTRACTS);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to create contract.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="New Contract Agreement"
      description="Create a formal employment agreement with wage compensation, structure, and working timetable."
      actions={
        <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Cancel
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
        {activeExistingContract && (
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-3 shadow-2xs">
            <History className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-blue-900">
                Active Contract in Effect: {activeExistingContract.contractType || 'Full-Time'} – {formatCurrency(activeExistingContract.salary || 0)} / month
              </p>
              <p className="text-blue-700 text-xs mt-1">
                Activating this new contract will automatically archive the current contract as <strong className="font-bold">EXPIRED</strong> in the employee's history as of {formData.startDate || 'the start date'}, preserving the complete contract timeline.
              </p>
            </div>
          </div>
        )}

        <Card>
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 font-semibold text-xs text-slate-800">
            Contract Terms & Compensation
          </div>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Employee" required>
              <Select
                options={[
                  { value: '', label: '-- Select Employee --' },
                  ...employeeOptions,
                ]}
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              />
            </FormField>

            <FormField label="Contract Type">
              <Select
                options={[
                  { value: 'PERMANENT', label: 'Permanent / Open-Ended' },
                  { value: 'FIXED_TERM', label: 'Fixed Term' },
                  { value: 'PROBATION', label: 'Probationary' },
                  { value: 'PART_TIME', label: 'Part-Time' },
                  { value: 'HOURLY', label: 'Hourly / Contractor' },
                ]}
                value={formData.contractType}
                onChange={(e) => {
                  const val = e.target.value;
                  const newWageType = val === 'HOURLY' ? 'HOURLY' : formData.wageType;
                  setFormData({ ...formData, contractType: val, wageType: newWageType });
                }}
              />
            </FormField>

            <FormField label="Wage Type / Frequency">
              <Select
                options={[
                  { value: 'MONTHLY', label: 'Monthly Fixed Wage' },
                  { value: 'HOURLY', label: 'Hourly Rate (Prorated on Attendance)' },
                ]}
                value={formData.wageType}
                onChange={(e) => setFormData({ ...formData, wageType: e.target.value })}
              />
            </FormField>

            <FormField label={formData.wageType === 'HOURLY' ? 'Hourly Wage Rate (₹ / hr)' : 'Monthly Wage Amount (₹ / month)'} required>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.wage}
                onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
              />
            </FormField>

            <FormField label="Status">
              <Select
                options={[
                  { value: 'RUNNING', label: 'Running / Active' },
                  { value: 'DRAFT', label: 'Draft' },
                ]}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              />
            </FormField>

            <FormField label="Salary Structure">
              <Select
                options={[
                  { value: '', label: '-- Default / None --' },
                  ...structureOptions,
                ]}
                value={formData.salaryStructureId}
                onChange={(e) => setFormData({ ...formData, salaryStructureId: e.target.value })}
              />
            </FormField>

            <FormField label="Working Schedule">
              <Select
                options={[
                  { value: '', label: '-- Default Schedule --' },
                  ...scheduleOptions,
                ]}
                value={formData.workingScheduleId}
                onChange={(e) => setFormData({ ...formData, workingScheduleId: e.target.value })}
              />
            </FormField>

            <FormField label="Effective Start Date" required>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </FormField>

            <FormField label="Contract End Date (Leave empty for open-ended)">
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" size="md" onClick={() => navigate(-1)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" icon={Save} isLoading={isSubmitting}>
            Save Contract
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

export default ContractFormPage;
