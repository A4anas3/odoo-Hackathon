import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { FormField } from '../../../components/form/FormField';
import { Input } from '../../../components/form/Input';
import { Select } from '../../../components/form/Select';
import { Button } from '../../../components/ui/Button';
import { contractApi } from '../api/contractApi';
import { useToast } from '../../../hooks/useToast';
import { ROUTES } from '../../../config/routes';
import { Save, ArrowLeft } from 'lucide-react';

export function ContractFormPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    employeeName: 'Sarah Connor',
    wage: 6500,
    wageType: 'MONTHLY',
    structureName: 'Regular Full-Time',
    scheduleName: 'Standard 40h',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'ACTIVE',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await contractApi.createContract({
        ...formData,
        employee: { name: formData.employeeName, code: 'EMP-001' },
      });
      toast.success('Contract created successfully.');
      navigate(ROUTES.CONTRACTS);
    } catch {
      toast.error('Failed to create contract.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="New Contract Agreement"
      description="Create a formal wage and employment structure contract."
      actions={
        <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Cancel
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
        <Card>
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 font-semibold text-xs text-slate-800">
            Contract Terms & Compensation
          </div>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Employee" required>
              <Select
                options={['Sarah Connor', 'Michael Scott', 'Dwight Schrute', 'Pam Beesly', 'Jim Halpert', 'Alex Vance']}
                value={formData.employeeName}
                onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
              />
            </FormField>

            <FormField label="Salary Structure">
              <Select
                options={['Regular Full-Time', 'Executive Management', 'Sales Commission Base', 'Hourly Contractor']}
                value={formData.structureName}
                onChange={(e) => setFormData({ ...formData, structureName: e.target.value })}
              />
            </FormField>

            <FormField label="Wage Amount ($)" required>
              <Input
                type="number"
                value={formData.wage}
                onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
              />
            </FormField>

            <FormField label="Wage Type">
              <Select
                options={[
                  { value: 'MONTHLY', label: 'Monthly Base' },
                  { value: 'HOURLY', label: 'Hourly Rate' },
                  { value: 'ANNUAL', label: 'Annual Salary' },
                ]}
                value={formData.wageType}
                onChange={(e) => setFormData({ ...formData, wageType: e.target.value })}
              />
            </FormField>

            <FormField label="Effective Start Date" required>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </FormField>

            <FormField label="Contract End Date (Optional)">
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
