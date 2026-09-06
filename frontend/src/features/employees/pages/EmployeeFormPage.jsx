import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { FormField } from '../../../components/form/FormField';
import { Input } from '../../../components/form/Input';
import { Select } from '../../../components/form/Select';
import { Button } from '../../../components/ui/Button';
import { useCreateEmployee, useUpdateEmployee, useEmployee, useEmployees } from '../hooks/useEmployees';
import { departmentApi } from '../../departments/api/departmentApi';
import { jobPositionApi } from '../../jobpositions/api/jobPositionApi';
import { contractApi } from '../../contracts/api/contractApi';
import { salaryStructureApi } from '../../salary/structures/api/salaryStructureApi';
import { salaryRuleApi } from '../../salary/rules/api/salaryRuleApi';
import { scheduleApi } from '../../schedules/api/scheduleApi';
import { ROUTES } from '../../../config/routes';
import { formatCurrency } from '../../../lib/utils/formatters';
import { useToast } from '../../../hooks/useToast';
import {
  Save,
  ArrowLeft,
  FileText,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Calculator,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  History,
  Info,
  Sparkles,
} from 'lucide-react';

export function EmployeeFormPage() {
  const toast = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existingEmployee } = useEmployee(id);
  const { data: allEmployees = [] } = useEmployees();
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

  const { data: salaryStructures = [] } = useQuery({
    queryKey: ['salary-structures'],
    queryFn: () => salaryStructureApi.getAllStructures(),
  });

  const { data: allSalaryRules = [] } = useQuery({
    queryKey: ['salary-rules'],
    queryFn: () => salaryRuleApi.getAllRules(),
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => scheduleApi.getAllSchedules(),
  });

  const { data: employeeContracts = [], refetch: refetchContracts } = useQuery({
    queryKey: ['contracts', 'employee', id],
    queryFn: () => contractApi.getContractsByEmployeeId(id),
    enabled: isEdit && Boolean(id),
  });

  const [showSalaryBreakdown, setShowSalaryBreakdown] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    departmentName: '',
    jobPositionName: '',
    employeeCode: '',
    managerId: '',
    employeeType: 'FULL_TIME',
    status: 'ACTIVE',
    joiningDate: new Date().toISOString().split('T')[0],
    bankName: '',
    bankAccountNo: '',
    ifscCode: '',
    password: '',
    role: 'EMPLOYEE',
  });

  // Contract & Wages State
  const [contractData, setContractData] = useState({
    enabled: true,
    mode: 'new', // 'new' | 'existing'
    selectedContractId: '',
    preserveHistory: false,
    contractType: 'PERMANENT',
    salary: '50000',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    salaryStructureId: '',
    workingScheduleId: '',
    status: 'RUNNING',
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

  // Set default structure and schedule
  useEffect(() => {
    if (!contractData.salaryStructureId && salaryStructures.length > 0) {
      setContractData((prev) => ({ ...prev, salaryStructureId: salaryStructures[0].id }));
    }
  }, [salaryStructures, contractData.salaryStructureId]);

  useEffect(() => {
    if (!contractData.workingScheduleId && schedules.length > 0) {
      setContractData((prev) => ({ ...prev, workingScheduleId: schedules[0].id }));
    }
  }, [schedules, contractData.workingScheduleId]);

  // Load existing employee data
  useEffect(() => {
    if (existingEmployee && isEdit) {
      setFormData({
        firstName: existingEmployee.firstName || '',
        lastName: existingEmployee.lastName || '',
        email: existingEmployee.email || '',
        phone: existingEmployee.phone || '',
        dateOfBirth: existingEmployee.dateOfBirth || '',
        address: existingEmployee.address || '',
        departmentName: existingEmployee.department?.name || existingEmployee.departmentName || 'Engineering',
        jobPositionName: existingEmployee.jobPosition?.name || existingEmployee.jobPositionTitle || 'Fullstack Engineer',
        employeeCode: existingEmployee.employeeCode || '',
        managerId: existingEmployee.managerId || existingEmployee.manager?.id || '',
        employeeType: existingEmployee.employeeType || 'FULL_TIME',
        status: existingEmployee.status || 'ACTIVE',
        joiningDate: existingEmployee.joiningDate || '',
        bankName: existingEmployee.bankName || '',
        bankAccountNo: existingEmployee.bankAccountNo || '',
        ifscCode: existingEmployee.ifscCode || '',
        password: '',
        role: existingEmployee.role || 'EMPLOYEE',
      });
    }
  }, [existingEmployee, isEdit]);

  // Load existing contracts for this employee when in edit mode
  useEffect(() => {
    if (isEdit && employeeContracts && employeeContracts.length > 0) {
      const activeOrFirst = employeeContracts.find((c) => c.status === 'RUNNING') || employeeContracts[0];
      setContractData({
        enabled: true,
        mode: 'existing',
        selectedContractId: activeOrFirst.id,
        preserveHistory: false,
        contractType: activeOrFirst.contractType || 'PERMANENT',
        salary: activeOrFirst.salary != null ? String(activeOrFirst.salary) : '',
        startDate: activeOrFirst.startDate || '',
        endDate: activeOrFirst.endDate || '',
        salaryStructureId: activeOrFirst.salaryStructureId || '',
        workingScheduleId: activeOrFirst.workingScheduleId || '',
        status: activeOrFirst.status || 'RUNNING',
      });
    }
  }, [isEdit, employeeContracts]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'joiningDate' && contractData.mode === 'new') {
      setContractData((prev) => ({ ...prev, startDate: value }));
    }
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleContractChange = (field, value) => {
    setContractData((prev) => ({ ...prev, [field]: value }));
    setBackendPreview(null);
  };

  // Switch between existing contract or creating a new one
  const handleSelectExistingContract = (contractId) => {
    setBackendPreview(null);
    if (contractId === 'NEW') {
      setContractData((prev) => ({
        ...prev,
        mode: 'new',
        selectedContractId: '',
        preserveHistory: false,
        startDate: formData.joiningDate || new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'RUNNING',
      }));
    } else {
      const c = employeeContracts.find((item) => item.id === contractId);
      if (c) {
        setContractData({
          enabled: true,
          mode: 'existing',
          selectedContractId: c.id,
          preserveHistory: false,
          contractType: c.contractType || 'PERMANENT',
          salary: c.salary != null ? String(c.salary) : '',
          startDate: c.startDate || '',
          endDate: c.endDate || '',
          salaryStructureId: c.salaryStructureId || '',
          workingScheduleId: c.workingScheduleId || '',
          status: c.status || 'RUNNING',
        });
      }
    }
  };

  // Custom rule overrides state allowing the admin to dynamically tune component amounts
  const [ruleOverrides, setRuleOverrides] = useState({});
  const [calculationMode, setCalculationMode] = useState('GROSS_LOCK'); // 'GROSS_LOCK' | 'RAW_FORMULA'
  const [backendPreview, setBackendPreview] = useState(null);
  const [isCalculatingBackend, setIsCalculatingBackend] = useState(false);
  const [lastCalculatedAt, setLastCalculatedAt] = useState(null);
  const [backendError, setBackendError] = useState(null);

  // Selected salary structure details
  const selectedStructure = useMemo(() => {
    return (
      salaryStructures.find((s) => s.id === contractData.salaryStructureId) ||
      salaryStructures[0]
    );
  }, [contractData.salaryStructureId, salaryStructures]);

  // Extract rules for this structure
  const structureRules = useMemo(() => {
    if (!selectedStructure) return [];
    if (selectedStructure.rules && selectedStructure.rules.length > 0) {
      return [...selectedStructure.rules].sort((a, b) => (a.sequence || 1) - (b.sequence || 1));
    }
    const filtered = allSalaryRules.filter(
      (r) =>
        r.salaryStructureId === selectedStructure.id ||
        (selectedStructure.name?.includes('Regular') && r.salaryStructureName?.includes('Regular'))
    );
    return [...filtered].sort((a, b) => (a.sequence || 1) - (b.sequence || 1));
  }, [selectedStructure, allSalaryRules]);

  // Trigger backend calculation from backend payroll engine
  const handleCalculateFromBackend = async () => {
    const wage = parseFloat(contractData.salary) || 0;
    if (wage <= 0) {
      toast.error('Please enter a valid Base Wage to calculate salary preview.');
      return;
    }

    setIsCalculatingBackend(true);
    setBackendError(null);
    try {
      const res = await contractApi.calculateSalaryPreview({
        wage,
        salaryStructureId: contractData.salaryStructureId || null,
        contractType: contractData.contractType,
        calculationMode,
        startDate: contractData.startDate || null,
        endDate: contractData.endDate || null,
        ruleOverrides: Object.keys(ruleOverrides).length > 0 ? ruleOverrides : null,
      });
      setBackendPreview(res);
      setLastCalculatedAt(new Date());
      if (res.ruleCount > 0) {
        toast.success(`Computed ${res.ruleCount} salary rules successfully!`);
      } else {
        toast.info(`Verified: 0 salary rules in "${res.structureName || 'Selected Structure'}". Base wage applied.`);
      }
    } catch (err) {
      console.error('Failed to calculate salary preview:', err);
      const msg = err.response?.data?.message || 'Payroll calculation engine unreachable. Please try again.';
      setBackendError(msg);
      toast.error(msg);
    } finally {
      setIsCalculatingBackend(false);
    }
  };

  // Live Salary Computation strictly derived from Backend Engine
  const salaryComputation = useMemo(() => {
    if (!backendPreview) {
      return null;
    }

    return {
      baseWage: Number(backendPreview.baseWage) || 0,
      gross: Number(backendPreview.grossSalary) || 0,
      basic: Number(backendPreview.basicSalary) || 0,
      allowances: Number(backendPreview.totalAllowances) || 0,
      deductions: Number(backendPreview.totalDeductions) || 0,
      net: Number(backendPreview.netSalary) || 0,
      annualCtc: Number(backendPreview.annualGross) || 0,
      annualNet: Number(backendPreview.annualNet) || 0,
      ruleCount: backendPreview.ruleCount || 0,
      structureName: backendPreview.structureName || selectedStructure?.name || 'Structure',
      items: (backendPreview.lines || []).map((l) => ({
        id: l.ruleId,
        code: l.code,
        name: l.name,
        category: l.category,
        calculationType: l.calculationType,
        percentage: l.percentage,
        formula: l.formula,
        value: l.value,
        monthly: Number(l.monthly),
        annual: Number(l.annual),
        isOverridden: Boolean(l.overridden),
      })),
      source: 'BACKEND',
    };
  }, [backendPreview, selectedStructure]);

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

    const selectedDept = departments.find((d) => d.name === formData.departmentName);
    const selectedJob = jobPositions.find((j) => (j.title || j.name) === formData.jobPositionName);

    const payload = {
      employeeCode: formData.employeeCode?.trim() || null,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth || null,
      address: formData.address,
      departmentId: selectedDept?.id || null,
      jobPositionId: selectedJob?.id || null,
      managerId: formData.managerId || null,
      employeeType: formData.employeeType,
      status: formData.status,
      joiningDate: formData.joiningDate || null,
      bankName: formData.bankName,
      bankAccountNo: formData.bankAccountNo,
      ifscCode: formData.ifscCode,
    };

    try {
      let savedEmployeeId = id;

      if (isEdit) {
        if (formData.role) payload.role = formData.role;
        if (formData.password?.trim()) payload.password = formData.password.trim();
        await updateMutation.mutateAsync({ id, data: payload });
      } else {
        payload.password = formData.password?.trim() || 'Passw0rd123';
        payload.role = formData.role || 'EMPLOYEE';
        const created = await createMutation.mutateAsync(payload);
        savedEmployeeId = created.id;
      }

      // Handle Contract & Wages assignment if enabled
      if (contractData.enabled && Number(contractData.salary) > 0) {
        const contractPayload = {
          employeeId: savedEmployeeId,
          contractType: contractData.contractType || 'PERMANENT',
          startDate: contractData.startDate || formData.joiningDate || new Date().toISOString().split('T')[0],
          endDate: contractData.endDate || null,
          salary: Number(contractData.salary),
          salaryStructureId: contractData.salaryStructureId || null,
          workingScheduleId: contractData.workingScheduleId || null,
          status: contractData.status || 'RUNNING',
        };

        if (contractData.mode === 'existing' && contractData.selectedContractId) {
          // Update contract with history preservation (archives previous contract only if ticked)
          await contractApi.updateContract(contractData.selectedContractId, contractPayload, {
            preserveHistory: Boolean(contractData.preserveHistory),
          });
        } else {
          // Create new contract (backend auto-archives any existing running contract to history)
          await contractApi.createContract(contractPayload);
        }
      }

      navigate(ROUTES.EMPLOYEE_DETAIL(savedEmployeeId));
    } catch (err) {
      console.error('Failed saving employee and contract:', err);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <PageContainer
      title={isEdit ? 'Edit Employee' : 'New Employee'}
      description="Enter employment, personal profile, wages, contract terms, and banking records."
      actions={
        <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Cancel
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Personal Details Card */}
        <Card>
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 font-semibold text-xs text-slate-800">
            1. Personal & Contact Information
          </div>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                placeholder="john.doe@company.com"
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

            <div className="sm:col-span-3">
              <FormField label="Residential Address">
                <Input
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Street address, City, Country"
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* 2. Organization Placement */}
        <Card>
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 font-semibold text-xs text-slate-800">
            2. Organization & Employment Placement
          </div>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Employee Code (Badge ID)">
              <Input
                value={formData.employeeCode}
                onChange={(e) => handleChange('employeeCode', e.target.value)}
                placeholder="e.g. EMP-010 (leave blank to auto-generate)"
              />
            </FormField>

            <FormField label="Department">
              {departments.length > 0 ? (
                <Select
                  options={departments.map((d) => ({ value: d.name, label: d.name }))}
                  value={formData.departmentName}
                  onChange={(e) => handleChange('departmentName', e.target.value)}
                />
              ) : (
                <Input
                  value={formData.departmentName}
                  onChange={(e) => handleChange('departmentName', e.target.value)}
                  placeholder="e.g. Engineering"
                />
              )}
            </FormField>

            <FormField label="Job Position">
              {jobPositions.length > 0 ? (
                <Select
                  options={jobPositions.map((j) => ({
                    value: j.title || j.name,
                    label: `${j.title || j.name}${j.department?.name ? ` (${j.department.name})` : ''}`,
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
                  { value: 'TERMINATED', label: 'Terminated / Fired' },
                  { value: 'ARCHIVED', label: 'Archived' },
                ]}
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* 3. Contract & Wages / Compensation Placement */}
        <Card className="border-emerald-200/60 shadow-xs">
          <div className="px-5 py-3 border-b border-slate-100 bg-emerald-50/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-700" />
              <div>
                <span className="font-bold text-xs text-slate-800">
                  3. Wages & Contract Placement
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Assign base wage, contract type, dates (from when to when), and salary structure.
                </span>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={contractData.enabled}
                onChange={(e) => handleContractChange('enabled', e.target.checked)}
                className="rounded border-slate-300 text-[#714B67] focus:ring-[#714B67]"
              />
              <span>Enroll / Manage Contract</span>
            </label>
          </div>

          {contractData.enabled && (
            <CardContent className="p-5 space-y-4">
              {/* Existing Contract Selector if editing an employee who already has contracts */}
              {isEdit && employeeContracts.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      Target Contract Record:
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Select an existing contract to modify, or create an additional contract tenure.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      options={[
                        ...employeeContracts.map((c) => ({
                          value: c.id,
                          label: `${c.contractType} (${c.startDate || '—'} to ${c.endDate || 'Present'}) – ₹${c.salary || 0} [${c.status}]`,
                        })),
                        { value: 'NEW', label: '+ Create New Contract / Tenure' },
                      ]}
                      value={contractData.mode === 'new' ? 'NEW' : contractData.selectedContractId}
                      onChange={(e) => handleSelectExistingContract(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {isEdit && contractData.mode === 'existing' && (
                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-blue-950">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={Boolean(contractData.preserveHistory)}
                      onChange={(e) => handleContractChange('preserveHistory', e.target.checked)}
                      className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>Record modification as new contract in history</span>
                  </label>
                  <span className="text-[11px] text-blue-700 bg-white/90 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium shadow-2xs">
                    Archives previous contract as EXPIRED with its historical wage & dates
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Wage / Base Salary */}
                <FormField label="Base Wage / Monthly Salary (₹)" required>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={contractData.salary}
                    onChange={(e) => handleContractChange('salary', e.target.value)}
                    placeholder="e.g. 50000"
                  />
                </FormField>

                {/* Contract / Wage Type */}
                <FormField label="Wage & Contract Type">
                  <Select
                    options={[
                      { value: 'PERMANENT', label: 'Permanent Full-Time' },
                      { value: 'CONTRACT', label: 'Fixed-Term Contract' },
                      { value: 'PART_TIME', label: 'Part-Time Hourly / Shift' },
                      { value: 'INTERNSHIP', label: 'Internship / Stipend' },
                      { value: 'PROBATIONARY', label: 'Probationary' },
                    ]}
                    value={contractData.contractType}
                    onChange={(e) => handleContractChange('contractType', e.target.value)}
                  />
                </FormField>

                {/* Contract Status */}
                <FormField label="Contract Status">
                  <Select
                    options={[
                      { value: 'RUNNING', label: 'Running (Active for Payroll)' },
                      { value: 'DRAFT', label: 'Draft / In Preparation' },
                      { value: 'EXPIRED', label: 'Expired' },
                      { value: 'CANCELLED', label: 'Cancelled' },
                    ]}
                    value={contractData.status}
                    onChange={(e) => handleContractChange('status', e.target.value)}
                  />
                </FormField>

                {/* Start Date (From When) */}
                <FormField label="From (Start Date)" required helperText="Effective date employee joins or contract begins">
                  <Input
                    type="date"
                    value={contractData.startDate}
                    onChange={(e) => handleContractChange('startDate', e.target.value)}
                  />
                </FormField>

                {/* End Date (To When) */}
                <FormField label="To (End Date)" helperText="Leave empty for open-ended / permanent contracts">
                  <Input
                    type="date"
                    value={contractData.endDate}
                    onChange={(e) => handleContractChange('endDate', e.target.value)}
                  />
                </FormField>

                {/* Salary Structure */}
                <FormField label="Salary Structure">
                  <Select
                    options={salaryStructures.map((s) => ({
                      value: s.id,
                      label: `${s.name} (${s.rulesCount ?? 0} rules)`,
                    }))}
                    value={contractData.salaryStructureId}
                    onChange={(e) => handleContractChange('salaryStructureId', e.target.value)}
                  />
                </FormField>

                {/* Working Schedule */}
                <div className="sm:col-span-2">
                  <FormField label="Working Schedule">
                    <Select
                      options={schedules.map((sc) => ({
                        value: sc.id,
                        label: `${sc.name || 'Standard'} (${sc.averageHoursPerDay || 8}h/day, ${sc.daysCount || 5} days/week)`,
                      }))}
                      value={contractData.workingScheduleId}
                      onChange={(e) => handleContractChange('workingScheduleId', e.target.value)}
                    />
                  </FormField>
                </div>
              </div>

              {/* Live Full Salary & Compensation Computation Breakdown */}
              <div className="pt-4 border-t border-slate-200/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center font-bold">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                        <span>Live Salary Breakdown & Full Take-Home Preview</span>
                        {backendPreview ? (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            Calculation Pending
                          </span>
                        )}
                        {lastCalculatedAt && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Synced {lastCalculatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {backendPreview
                          ? `Calculated using "${backendPreview.structureName || selectedStructure?.name || 'Structure'}" (${backendPreview.ruleCount} rules) for ₹${Number(backendPreview.baseWage).toLocaleString('en-IN')} / month.`
                          : 'Click "Calculate" to verify and preview salary.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Calculate Button */}
                    <Button
                      type="button"
                      variant="primary"
                      size="xs"
                      onClick={handleCalculateFromBackend}
                      disabled={isCalculatingBackend || Number(contractData.salary) <= 0}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                      title="Calculate salary breakdown based on contract rules"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isCalculatingBackend ? 'animate-spin' : ''}`} />
                      {isCalculatingBackend
                        ? 'Calculating...'
                        : 'Calculate'}
                    </Button>

                    {contractData.salaryStructureId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        icon={ExternalLink}
                        title="View Structure & Rules in new tab"
                        onClick={() =>
                          window.open(ROUTES.SALARY_STRUCTURE_DETAIL(contractData.salaryStructureId), '_blank')
                        }
                      >
                        Structure Rules ({structureRules.length})
                      </Button>
                    )}

                    {isEdit && employeeContracts.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        icon={History}
                        title="View Contracts"
                        onClick={() => navigate(ROUTES.CONTRACTS)}
                      >
                        Contracts ({employeeContracts.length})
                      </Button>
                    )}

                    {backendPreview && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        onClick={() => setShowSalaryBreakdown((prev) => !prev)}
                        icon={showSalaryBreakdown ? ChevronUp : ChevronDown}
                      >
                        {showSalaryBreakdown ? 'Hide Breakdown' : 'View Itemized Breakdown'}
                      </Button>
                    )}
                  </div>
                </div>

                {backendPreview && salaryComputation ? (
                  <div className="space-y-3">
                    {/* 4 Summary Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {/* 1. Monthly Gross */}
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Monthly Gross
                        </span>
                        <span className="text-sm font-bold text-slate-900 block mt-0.5 font-mono">
                          {formatCurrency(salaryComputation.gross, 'INR')}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
                          Basic: {formatCurrency(salaryComputation.basic, 'INR')}
                        </span>
                      </div>

                      {/* 2. Monthly Deductions */}
                      <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100">
                        <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider block">
                          Deductions (PF/PT)
                        </span>
                        <span className="text-sm font-bold text-rose-600 block mt-0.5 font-mono">
                          -{formatCurrency(salaryComputation.deductions, 'INR')}
                        </span>
                        <span className="text-[10px] text-rose-600/80 block mt-0.5">
                          Statutory & Taxes
                        </span>
                      </div>

                      {/* 3. Net Take-Home Salary */}
                      <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                            Net Take-Home
                          </span>
                          <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">
                            In-Hand
                          </span>
                        </div>
                        <span className="text-base font-extrabold text-emerald-700 block mt-0.5 font-mono">
                          {formatCurrency(salaryComputation.net, 'INR')}
                        </span>
                        <span className="text-[10px] text-emerald-600 block mt-0.5">
                          Monthly Bank Deposit
                        </span>
                      </div>

                      {/* 4. Annual CTC */}
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Annual CTC Package
                        </span>
                        <span className="text-sm font-bold text-slate-900 block mt-0.5 font-mono">
                          {formatCurrency(salaryComputation.annualCtc, 'INR')}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
                          Annual Net: {formatCurrency(salaryComputation.annualNet, 'INR')}
                        </span>
                      </div>
                    </div>

                    {/* Segmented Distribution Bar */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span className="font-semibold">Compensation Distribution Ratio</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          Take-Home:{' '}
                          <strong className="text-emerald-700">
                            {(
                              (salaryComputation.net / (salaryComputation.gross || 1)) *
                              100
                            ).toFixed(1)}
                            %
                          </strong>{' '}
                          • Deductions:{' '}
                          <strong className="text-rose-600">
                            {(
                              (salaryComputation.deductions / (salaryComputation.gross || 1)) *
                              100
                            ).toFixed(1)}
                            %
                          </strong>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              (salaryComputation.basic / (salaryComputation.gross || 1)) * 100
                            )}%`,
                          }}
                          className="bg-blue-500"
                          title="Basic Salary"
                        />
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              (salaryComputation.allowances / (salaryComputation.gross || 1)) * 100
                            )}%`,
                          }}
                          className="bg-emerald-400"
                          title="Allowances"
                        />
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              (salaryComputation.deductions / (salaryComputation.gross || 1)) * 100
                            )}%`,
                          }}
                          className="bg-rose-400"
                          title="Deductions"
                        />
                      </div>
                    </div>

                    {/* Expandable Itemized Rule Breakdown Table */}
                    {showSalaryBreakdown && (
                      <div className="border border-slate-200 rounded-lg overflow-hidden space-y-2">
                        {/* Computation Mode & Custom Edits Toolbar */}
                        <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">Gross Alignment:</span>
                            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => setCalculationMode('GROSS_LOCK')}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                                  calculationMode === 'GROSS_LOCK'
                                    ? 'bg-[#714B67] text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="Caps Total Gross exactly at entered Base Wage"
                              >
                                Match Base Wage (₹{Number(contractData.salary).toLocaleString('en-IN')})
                              </button>
                              <button
                                type="button"
                                onClick={() => setCalculationMode('RAW_FORMULA')}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                                  calculationMode === 'RAW_FORMULA'
                                    ? 'bg-[#714B67] text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="Strictly evaluates database formulas as configured"
                              >
                                Raw Structure Formulas
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {Object.keys(ruleOverrides).length > 0 && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="xs"
                                onClick={() => setRuleOverrides({})}
                              >
                                Reset Custom Edits ({Object.keys(ruleOverrides).length})
                              </Button>
                            )}
                            <span className="text-[11px] text-slate-400 font-medium">
                              Click any amount to customize
                            </span>
                          </div>
                        </div>

                        {salaryComputation.items.length > 0 ? (
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="p-2.5">Salary Component / Rule</th>
                                <th className="p-2.5">Category</th>
                                <th className="p-2.5">Calculation Basis</th>
                                <th className="p-2.5 text-right">Monthly (₹)</th>
                                <th className="p-2.5 text-right">Annual (₹)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {salaryComputation.items.map((item, idx) => {
                                const isDed = item.category === 'DED' || item.category === 'TAX';
                                const isNet = item.category === 'NET';
                                const isGross = item.category === 'GROSS';
                                const isBasic = item.category === 'BASIC';
                                const isEditable = !isNet && !isGross;

                                return (
                                  <tr
                                    key={item.code || idx}
                                    className={
                                      isNet
                                        ? 'bg-emerald-50/50 font-bold text-emerald-950'
                                        : isGross
                                        ? 'bg-slate-50/60 font-bold text-slate-900'
                                        : 'hover:bg-slate-50/60'
                                    }
                                  >
                                    <td className="p-2.5">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-800">
                                          {item.name}
                                        </span>
                                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                          {item.code}
                                        </span>
                                        {item.id && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              window.open(ROUTES.SALARY_RULE_DETAIL(item.id), '_blank')
                                            }
                                            className="text-slate-400 hover:text-[#714B67] p-0.5 rounded hover:bg-slate-100"
                                            title="Edit master rule in Rule Builder"
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-2.5">
                                      <span
                                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                          isNet
                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                            : isGross
                                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                                            : isDed
                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                            : isBasic
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : 'bg-teal-50 text-teal-700 border-teal-200'
                                        }`}
                                      >
                                        {item.category}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                                      {item.formula ||
                                        (item.percentage ? `${item.percentage}%` : 'Fixed')}
                                    </td>
                                    <td className="p-2.5 text-right font-mono font-semibold">
                                      {isEditable ? (
                                        <div className="flex items-center justify-end gap-1">
                                          <span className="text-slate-400 font-mono text-xs">₹</span>
                                          <input
                                            type="number"
                                            min="0"
                                            step="50"
                                            value={
                                              ruleOverrides[item.code] !== undefined
                                                ? ruleOverrides[item.code]
                                                : item.monthly
                                            }
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setRuleOverrides((prev) => ({
                                                ...prev,
                                                [item.code]: val === '' ? '' : parseFloat(val) || 0,
                                              }));
                                            }}
                                            className={`w-24 text-right font-mono text-xs px-2 py-1 border rounded-md transition-all ${
                                              ruleOverrides[item.code] !== undefined
                                                ? 'border-[#714B67] bg-[#714B67]/10 text-slate-900 font-bold ring-1 ring-[#714B67]/40'
                                                : isDed
                                                ? 'border-slate-200 bg-rose-50/30 text-rose-700 hover:border-rose-300 focus:border-[#714B67] focus:bg-white'
                                                : 'border-slate-200 bg-slate-50/70 text-slate-900 hover:border-slate-300 focus:border-[#714B67] focus:bg-white'
                                            }`}
                                            title="Click to customize this component's price/amount for this employee"
                                          />
                                        </div>
                                      ) : (
                                        <span
                                          className={
                                            isNet
                                              ? 'text-emerald-700 font-extrabold text-sm'
                                              : isGross
                                              ? 'text-slate-900 font-bold text-sm'
                                              : isDed
                                              ? 'text-rose-600'
                                              : 'text-slate-800'
                                          }
                                        >
                                          {isDed ? '-' : ''}
                                          {formatCurrency(item.monthly, 'INR')}
                                        </span>
                                      )}
                                    </td>
                                    <td
                                      className={`p-2.5 text-right font-mono ${
                                        isNet
                                          ? 'text-emerald-800 font-extrabold'
                                          : isGross
                                          ? 'text-slate-900 font-bold'
                                          : isDed
                                          ? 'text-rose-700'
                                          : 'text-slate-600'
                                      }`}
                                    >
                                      {isDed ? '-' : ''}
                                      {formatCurrency(item.annual, 'INR')}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200 text-xs">
                              <tr>
                                <td className="p-2.5" colSpan={3}>
                                  Total Net Pay (In-Hand Take-Home)
                                </td>
                                <td className="p-2.5 text-right font-extrabold text-emerald-700 font-mono text-sm">
                                  {formatCurrency(salaryComputation.net, 'INR')}
                                </td>
                                <td className="p-2.5 text-right font-extrabold text-emerald-800 font-mono text-sm">
                                  {formatCurrency(salaryComputation.annualNet, 'INR')}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        ) : (
                          <div className="p-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 m-3">
                            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2.5">
                              <AlertCircle className="w-5 h-5" />
                            </div>
                            <h5 className="text-xs font-bold text-slate-800">
                              No Salary Rules Configured in "{selectedStructure?.name || 'Selected Structure'}"
                            </h5>
                            <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1">
                              This structure has 0 calculation rules in the database. Monthly Gross is {formatCurrency(salaryComputation.gross, 'INR')}, Deductions are {formatCurrency(0, 'INR')}, and Net In-Hand is {formatCurrency(salaryComputation.net, 'INR')}.
                            </p>
                            <div className="mt-3 flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="primary"
                                size="xs"
                                onClick={handleCalculateFromBackend}
                                disabled={isCalculatingBackend}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                              >
                                <Sparkles className={`w-3.5 h-3.5 mr-1 ${isCalculatingBackend ? 'animate-spin' : ''}`} />
                                {isCalculatingBackend ? 'Calculating...' : 'Calculate'}
                              </Button>
                              {contractData.salaryStructureId && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="xs"
                                  icon={ExternalLink}
                                  onClick={() =>
                                    window.open(
                                      ROUTES.SALARY_STRUCTURE_DETAIL(contractData.salaryStructureId),
                                      '_blank'
                                    )
                                  }
                                >
                                  Configure Rules for "{selectedStructure?.name}"
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="p-2 bg-slate-50/80 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-1.5 px-3">
                          <Info className="w-3.5 h-3.5 text-[#714B67] shrink-0" />
                          <span>
                            Prices and formulas are fully dynamic. You can click and edit any component amount directly in the table above to customize prices, or toggle "Match Base Wage" to ensure allowances fit within the agreed salary.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50/70 border-2 border-dashed border-slate-200/90 rounded-2xl p-6 text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-2xs">
                      <Calculator className="w-6 h-6" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <h4 className="text-sm font-bold text-slate-900">
                        Calculate Salary Preview
                      </h4>
                      <p className="text-xs text-slate-500">
                        To calculate the official take-home pay and verify rules for this contract, click the button below.
                      </p>
                    </div>

                    <div className="inline-flex flex-wrap items-center justify-center gap-2.5 text-xs text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-2xs">
                      <span>Base Wage: <strong className="text-slate-900 font-mono font-bold">₹{Number(contractData.salary || 0).toLocaleString('en-IN')}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>Structure: <strong className="text-slate-900 font-semibold">{selectedStructure?.name || 'Standard'}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>Contract: <strong className="text-slate-900 font-semibold">{contractData.contractType}</strong></span>
                    </div>

                    <div>
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={handleCalculateFromBackend}
                        disabled={isCalculatingBackend || Number(contractData.salary) <= 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs inline-flex items-center gap-2 px-5 py-2.5 cursor-pointer"
                      >
                        <Sparkles className={`w-4 h-4 ${isCalculatingBackend ? 'animate-spin' : ''}`} />
                        {isCalculatingBackend ? 'Calculating...' : 'Calculate'}
                      </Button>
                    </div>

                    {backendError && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-center gap-2 max-w-md mx-auto text-left">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{backendError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* 4. Banking Information */}
        <Card>
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 font-semibold text-xs text-slate-800">
            4. Banking & Direct Deposit Details
          </div>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Bank Name">
              <Input
                value={formData.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
                placeholder="e.g. State Bank of India"
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
                placeholder="e.g. SBIN0001"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* 5. User Login & Workspace Access */}
        <Card className="border border-blue-100 bg-blue-50/20">
          <div className="px-6 py-4 border-b border-blue-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isEdit ? 'Login Credentials & Workspace Role' : 'Login Access & Workspace Role'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEdit
                  ? 'Manage account login password and workspace RBAC permissions for this employee.'
                  : 'Provision an immediate user login account for this employee.'}
              </p>
            </div>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
              {isEdit ? 'User Account & Security' : 'Auto-Provision'}
            </span>
          </div>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={isEdit ? 'Update Password (Optional)' : 'Login Password'}
              helperText={
                isEdit
                  ? 'Leave empty to keep existing password, or enter new password to reset.'
                  : 'Leave empty to use default initial password: Passw0rd123'
              }
            >
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={isEdit ? 'Leave blank to keep existing password' : '•••••••••••• (Default: Passw0rd123)'}
                autoComplete="new-password"
              />
            </FormField>

            <FormField label="Assigned Workspace Role">
              <Select
                options={[
                  { value: 'EMPLOYEE', label: 'Employee (Personal records & punches)' },
                  { value: 'HR_MANAGER', label: 'HR Manager (Full staff records & approvals)' },
                  { value: 'HR_PAYROLL_USER', label: 'HR Payroll User (Payrun calculations)' },
                  { value: 'HR_PAYROLL_ADMIN', label: 'HR Payroll Admin (Salary rules & approvals)' },
                  { value: 'ADMIN', label: 'Admin (Full System & User Management)' },
                ]}
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
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
