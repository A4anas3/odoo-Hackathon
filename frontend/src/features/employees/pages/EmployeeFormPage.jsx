import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { FormField } from '../../../components/form/FormField';
import { Input } from '../../../components/form/Input';
import { Select } from '../../../components/form/Select';
import { Button } from '../../../components/ui/Button';
import { useCreateEmployee, useUpdateEmployee, useEmployee } from '../hooks/useEmployees';
import { departmentApi } from '../../departments/api/departmentApi';
import { jobPositionApi } from '../../jobpositions/api/jobPositionApi';
import { ROUTES } from '../../../config/routes';
import { Save, ArrowLeft } from 'lucide-react';

export function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existingEmployee } = useEmployee(id);
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentApi.getAllDepartments,
  });

  const { data: jobPositions = [] } = useQuery({
    queryKey: ['job-positions'],
    queryFn: () => jobPositionApi.getAllJobPositions(),
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    departmentName: '',
    jobPositionName: '',
    employeeType: 'FULL_TIME',
    status: 'ACTIVE',
    joiningDate: new Date().toISOString().split('T')[0],
    bankName: '',
    bankAccountNo: '',
    ifscCode: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!formData.departmentName && departments.length > 0 && !isEdit) {
      setFormData((prev) => ({ ...prev, departmentName: departments[0].name }));
    }
  }, [departments, isEdit, formData.departmentName]);

  useEffect(() => {
    if (!formData.jobPositionName && jobPositions.length > 0 && !isEdit) {
      setFormData((prev) => ({ ...prev, jobPositionName: jobPositions[0].title || jobPositions[0].name }));
    }
  }, [jobPositions, isEdit, formData.jobPositionName]);

  useEffect(() => {
    if (existingEmployee && isEdit) {
      setFormData({
        firstName: existingEmployee.firstName || '',
        lastName: existingEmployee.lastName || '',
        email: existingEmployee.email || '',
        phone: existingEmployee.phone || '',
        dateOfBirth: existingEmployee.dateOfBirth || '',
        address: existingEmployee.address || '',
        departmentName: existingEmployee.department?.name || 'Engineering',
        jobPositionName: existingEmployee.jobPosition?.name || 'Fullstack Engineer',
        employeeType: existingEmployee.employeeType || 'FULL_TIME',
        status: existingEmployee.status || 'ACTIVE',
        joiningDate: existingEmployee.joiningDate || '',
        bankName: existingEmployee.bankName || '',
        bankAccountNo: existingEmployee.bankAccountNo || '',
        ifscCode: existingEmployee.ifscCode || '',
      });
    }
  }, [existingEmployee, isEdit]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email address is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      ...formData,
      department: { name: formData.departmentName },
      jobPosition: { name: formData.jobPositionName },
    };

    if (isEdit) {
      await updateMutation.mutateAsync({ id, data: payload });
      navigate(ROUTES.EMPLOYEE_DETAIL(id));
    } else {
      const created = await createMutation.mutateAsync(payload);
      navigate(ROUTES.EMPLOYEE_DETAIL(created.id));
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <PageContainer
      title={isEdit ? 'Edit Employee' : 'New Employee'}
      description="Enter employment, personal profile, and banking records."
      actions={
        <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Cancel
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Personal Details Card */}
        <Card>
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 font-semibold text-xs text-slate-800">
            1. Personal & Contact Information
          </div>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <FormField label="First Name" required error={errors.firstName}>
              <Input
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="e.g. John"
              />
            </FormField>

            <FormField label="Last Name" required error={errors.lastName}>
              <Input
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="e.g. Doe"
              />
            </FormField>

            <FormField label="Work Email" required error={errors.email}>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="john.doe@odoo.com"
              />
            </FormField>

            <FormField label="Phone Number">
              <Input
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+1 555-0199"
              />
            </FormField>

            <FormField label="Date of Birth">
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              />
            </FormField>

            <FormField label="Residential Address" className="sm:col-span-2 md:col-span-3">
              <Input
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Street address, City, Country"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Organization Information */}
        <Card>
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 font-semibold text-xs text-slate-800">
            2. Organization & Employment Placement
          </div>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <FormField label="Department">
              <Select
                options={
                  departments.length > 0
                    ? departments.map((d) => ({ value: d.name, label: d.name }))
                    : [{ value: '', label: 'Loading departments...' }]
                }
                value={formData.departmentName}
                onChange={(e) => handleChange('departmentName', e.target.value)}
              />
            </FormField>

            <FormField label="Job Position">
              {jobPositions.length > 0 ? (
                <Select
                  options={jobPositions.map((j) => ({
                    value: j.title || j.name,
                    label: `${j.title || j.name}${j.departmentName ? ` (${j.departmentName})` : ''}`,
                  }))}
                  value={formData.jobPositionName}
                  onChange={(e) => handleChange('jobPositionName', e.target.value)}
                />
              ) : (
                <Input
                  value={formData.jobPositionName}
                  onChange={(e) => handleChange('jobPositionName', e.target.value)}
                  placeholder="e.g. Fullstack Engineer"
                />
              )}
            </FormField>

            <FormField label="Employment Type">
              <Select
                options={[
                  { value: 'FULL_TIME', label: 'Full Time' },
                  { value: 'PART_TIME', label: 'Part Time' },
                  { value: 'CONTRACTOR', label: 'Contractor' },
                  { value: 'INTERN', label: 'Intern' },
                ]}
                value={formData.employeeType}
                onChange={(e) => handleChange('employeeType', e.target.value)}
              />
            </FormField>

            <FormField label="Joining Date">
              <Input
                type="date"
                value={formData.joiningDate}
                onChange={(e) => handleChange('joiningDate', e.target.value)}
              />
            </FormField>

            <FormField label="Status">
              <Select
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'ON_LEAVE', label: 'On Leave' },
                  { value: 'INACTIVE', label: 'Inactive' },
                ]}
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Banking Information */}
        <Card>
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 font-semibold text-xs text-slate-800">
            3. Banking & Direct Deposit Details
          </div>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Bank Name">
              <Input
                value={formData.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
                placeholder="e.g. Silicon Valley Bank"
              />
            </FormField>

            <FormField label="Account Number">
              <Input
                value={formData.bankAccountNo}
                onChange={(e) => handleChange('bankAccountNo', e.target.value)}
                placeholder="Account number"
              />
            </FormField>

            <FormField label="IFSC / Routing Code">
              <Input
                value={formData.ifscCode}
                onChange={(e) => handleChange('ifscCode', e.target.value)}
                placeholder="e.g. SVB0001"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" size="md" onClick={() => navigate(-1)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" icon={Save} isLoading={isSaving}>
            {isEdit ? 'Save Changes' : 'Create Employee Profile'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
