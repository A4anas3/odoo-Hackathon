import React, { useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { StatusBadge } from '@/components/badge/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/modal/Modal';
import { FormField } from '@/components/form/FormField';
import { Input } from '@/components/form/Input';
import { Select } from '@/components/form/Select';
import { Checkbox } from '@/components/form/Checkbox';
import { payrunApi } from '../api/payrunApi';
import { contractApi } from '@/features/contracts/api/contractApi';
import { employeeApi } from '@/features/employees/api/employeeApi';
import { salaryStructureApi } from '@/features/salary/structures/api/salaryStructureApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ROUTES } from '@/config/routes';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import {
  Plus,
  Coins,
  Eye,
  Search,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  Info,
  Clock,
  Briefcase,
} from 'lucide-react';

export function PayrunListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');

  // 2-Step Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1 = Scope selection, 2 = Employee selection
  const [periodStart, setPeriodStart] = useState('2026-02-01');
  const [periodEnd, setPeriodEnd] = useState('2026-02-28');
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [empSearch, setEmpSearch] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [step2Tab, setStep2Tab] = useState('matching'); // 'matching' or 'all'

  const { data: payruns = [], isLoading } = useQuery({
    queryKey: ['payroll', 'payruns'],
    queryFn: () => payrunApi.getAllPayruns(),
  });

  const { data: structures = [] } = useQuery({
    queryKey: ['salary-structures'],
    queryFn: salaryStructureApi.getAllStructures,
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => contractApi.getContracts(),
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees', { size: 100 }],
    queryFn: () => employeeApi.getAllEmployees({ size: 100 }),
  });
  const rawEmployees = employeesData?.content || (Array.isArray(employeesData) ? employeesData : []);

  // Set default structure once loaded
  React.useEffect(() => {
    if (structures.length > 0 && !selectedStructureId) {
      setSelectedStructureId(structures[0].id);
    }
  }, [structures, selectedStructureId]);

  // Map active contracts by employee ID
  const activeContractsByEmployee = useMemo(() => {
    const map = new Map();
    contracts.forEach((c) => {
      const empId = c.employeeId || c.employee?.id;
      if (!empId) return;
      const status = (c.status || '').toUpperCase();
      if (status === 'RUNNING' || status === 'ACTIVE') {
        map.set(empId, c);
      } else if (!map.has(empId)) {
        map.set(empId, c);
      }
    });
    return map;
  }, [contracts]);

  // Transform employees list with real contract data
  const staffList = useMemo(() => {
    return rawEmployees.map((emp) => {
      const contract = activeContractsByEmployee.get(emp.id);
      const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.fullName || 'Employee';
      const code = emp.employeeCode || `EMP-${emp.id?.substring(0, 4)}`;
      const scheduleName = contract?.workingScheduleName || emp.workingSchedule?.name;
      const hours = scheduleName ? scheduleName.split('/')[0] : '40 hrs/week';
      const startDate = contract?.startDate ? formatDate(contract.startDate) : (emp.joiningDate ? formatDate(emp.joiningDate) : '—');
      
      const wage = contract?.salary != null ? Number(contract.salary) : 0;
      const wageType = (contract?.wageType || (contract?.contractType?.toUpperCase().includes('HOUR') ? 'HOURLY' : 'MONTHLY')).toUpperCase();
      const isHourly = wageType === 'HOURLY';
      const structureId = contract?.salaryStructureId || null;
      const structureName = contract?.salaryStructureName || 'Unassigned';
      const contractType = contract?.contractType || 'No Contract';
      const hasActiveContract = Boolean(contract && ((contract.status || '').toUpperCase() === 'RUNNING' || (contract.status || '').toUpperCase() === 'ACTIVE'));

      return {
        id: emp.id,
        name,
        code,
        hours,
        startDate,
        wage,
        wageType,
        isHourly,
        structureId,
        structureName,
        contractType,
        hasActiveContract,
        contract,
      };
    });
  }, [rawEmployees, activeContractsByEmployee]);

  // Staff with active contracts matching selected salary structure (or all active contracts if none specified)
  const matchingStaff = useMemo(() => {
    return staffList.filter((s) => {
      if (!s.hasActiveContract) return false;
      if (!selectedStructureId) return true;
      return s.structureId === selectedStructureId;
    });
  }, [staffList, selectedStructureId]);

  // Displayed staff for Step 2 based on active tab and search
  const displayedStaff = useMemo(() => {
    const list = step2Tab === 'matching' ? matchingStaff : staffList;
    if (!empSearch) return list;
    const q = empSearch.toLowerCase();
    return list.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.structureName.toLowerCase().includes(q) ||
      s.contractType.toLowerCase().includes(q)
    );
  }, [step2Tab, matchingStaff, staffList, empSearch]);

  const selectableStaff = useMemo(() => {
    return (step2Tab === 'matching' ? matchingStaff : staffList).filter((s) => s.hasActiveContract);
  }, [step2Tab, matchingStaff, staffList]);

  const isAllSelected = selectableStaff.length > 0 && selectableStaff.every((s) => selectedEmployees.includes(s.id));

  // Open modal handler
  const handleOpenNewModal = () => {
    setModalStep(1);
    setIsModalOpen(true);
    setStep2Tab('matching');
    if (structures.length > 0 && !selectedStructureId) {
      setSelectedStructureId(structures[0].id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalStep(1);
    setEmpSearch('');
  };

  // Step 1 -> Step 2
  const handleContinueToStep2 = () => {
    if (!periodStart || !periodEnd) {
      toast.error('Please select both period start and end dates.');
      return;
    }
    // Pre-select matching eligible employees
    const targetIds = matchingStaff.map((s) => s.id);
    setSelectedEmployees(targetIds);
    setStep2Tab('matching');
    setModalStep(2);
  };

  // Toggle single employee
  const toggleEmployee = (id) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle all employees in current view
  const toggleSelectAll = () => {
    if (isAllSelected) {
      const selectableIds = new Set(selectableStaff.map((s) => s.id));
      setSelectedEmployees((prev) => prev.filter((id) => !selectableIds.has(id)));
    } else {
      const selectableIds = selectableStaff.map((s) => s.id);
      setSelectedEmployees((prev) => Array.from(new Set([...prev, ...selectableIds])));
    }
  };

  // Calculate total monthly wages and hourly count of selected employees
  const { totalMonthlyWage, hourlyCount, totalHourlyWage, totalSelected } = useMemo(() => {
    let monthlySum = 0;
    let hourlySum = 0;
    let hourlyStaffCount = 0;
    let count = 0;
    staffList.forEach((s) => {
      if (selectedEmployees.includes(s.id)) {
        count++;
        if (s.isHourly) {
          hourlyStaffCount++;
          hourlySum += Number(s.wage || 0);
        } else {
          monthlySum += Number(s.wage || 0);
        }
      }
    });
    return {
      totalMonthlyWage: monthlySum,
      hourlyCount: hourlyStaffCount,
      totalHourlyWage: hourlySum,
      totalSelected: count,
    };
  }, [staffList, selectedEmployees]);

  // Create Payrun Mutation
  const createPayrunMutation = useMutation({
    mutationFn: (data) => payrunApi.generatePayrun(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'payruns'] });
      toast.success('Payrun created successfully.');
      handleCloseModal();
      if (created?.id) {
        navigate(ROUTES.PAYRUN_DETAIL(created.id));
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to create payrun.');
    },
  });

  const handleCreatePayrun = () => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee for the payrun.');
      return;
    }
    createPayrunMutation.mutate({
      periodStart,
      periodEnd,
      salaryStructureId: selectedStructureId || null,
      employeeIds: selectedEmployees,
    });
  };

  // Filter Payruns
  const filteredPayruns = payruns.filter((p) => {
    if (!search) return true;
    const name = (p.name || '').toLowerCase();
    const period = `${p.periodStart || ''} ${p.periodEnd || ''}`.toLowerCase();
    return name.includes(search.toLowerCase()) || period.includes(search.toLowerCase());
  });

  return (
    <PageContainer
      title="Payruns"
      description="Manage payroll execution across payroll periods."
      actions={
        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenNewModal}>
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
            placeholder="Search payruns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#714B67] transition-all"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredPayruns.length} payrun{filteredPayruns.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Payrun Cards List (Matches Wireframe 4) */}
      <div className="space-y-3">
        {filteredPayruns.length > 0 ? (
          filteredPayruns.map((payrun) => {
            const warnings = Array.isArray(payrun.warnings) ? payrun.warnings : [];
            const warningCount = warnings.length;
            const payslipCount = payrun.payslipCount ?? payrun.employeeCount ?? (payrun.payslips?.length || 0);

            return (
              <div
                key={payrun.id}
                onClick={() => navigate(ROUTES.PAYRUN_DETAIL(payrun.id))}
                className="bg-white rounded-xl border border-slate-200/90 p-4 hover:border-[#714B67]/50 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Left: Icon, Name, Period */}
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#714B67]/10 text-[#714B67] flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-[#714B67] transition-colors">
                      {payrun.name || `Payrun ${payrun.periodStart}`}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(payrun.periodStart)} – {formatDate(payrun.periodEnd)}
                    </p>
                  </div>
                </div>

                {/* Center: Payslip count & Warnings */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>{payslipCount} payslips</span>
                  </div>

                  {warningCount > 0 ? (
                    <div
                      title={warnings.join('\n')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span>{warningCount} warning{warningCount !== 1 ? 's' : ''}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>All valid</span>
                    </div>
                  )}

                  <StatusBadge status={payrun.status || 'DRAFT'} />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 group-hover:text-[#714B67]"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(ROUTES.PAYRUN_DETAIL(payrun.id));
                    }}
                    title="View Payrun"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
            <Coins className="w-10 h-10 mx-auto text-slate-300 stroke-1 mb-2" />
            <p className="font-semibold text-sm text-slate-700">No Payruns Found</p>
            <p className="text-xs text-slate-400 mt-1">Click "NEW" above to configure and execute a new payrun.</p>
          </div>
        )}
      </div>


      {/* 2-Step New Pay Run Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalStep === 1 ? 'New Pay Run' : 'Select Employee Records'}
        description={
          modalStep === 1
            ? 'Select the payroll scope and computation period.'
            : `Select eligible employees to include in this payrun (selected ${selectedEmployees.length} / ${staffList.length}).`
        }
        size={modalStep === 1 ? 'md' : 'lg'}
      >
        {modalStep === 1 ? (
          /* STEP 1: Payrun Scope */
          <div className="space-y-4">
            <FormField label="Pay Structure" required helperText="Structure determines rules used for salary calculation">
              <Select
                options={
                  structures.length > 0
                    ? structures.map((s) => ({
                        value: s.id,
                        label: `${s.name} (${s.rules?.length || 0} rules)`,
                      }))
                    : [{ value: '', label: 'United States: Regular Pay' }]
                }
                value={selectedStructureId}
                onChange={(e) => setSelectedStructureId(e.target.value)}
              />
            </FormField>

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

            {/* Wireframe Participant Note */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Participant note:</strong> this popup selects the payrun scope only. Continue should not create the Payrun yet.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={handleCloseModal}>
                Discard
              </Button>
              <Button variant="primary" size="sm" icon={ArrowRight} onClick={handleContinueToStep2}>
                Continue
              </Button>
            </div>
          </div>
        ) : (
          /* STEP 2: Select Employee Records */
          <div className="space-y-4">
            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setStep2Tab('matching')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    step2Tab === 'matching'
                      ? 'bg-[#714B67] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70'
                  }`}
                >
                  Matching Structure ({matchingStaff.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStep2Tab('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    step2Tab === 'all'
                      ? 'bg-[#714B67] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70'
                  }`}
                >
                  All Staff ({staffList.length})
                </button>
              </div>

              <div className="w-full sm:w-60 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search staff, code, contract..."
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#714B67] transition-all"
                />
              </div>
            </div>

            {/* Selection status header */}
            <div className="flex items-center justify-between gap-3 text-xs bg-slate-50/70 p-2.5 rounded-lg border border-slate-200/80">
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="xs" onClick={toggleSelectAll}>
                  {isAllSelected ? 'Deselect View' : 'Select All in View'}
                </Button>
                <span className="text-slate-500 font-medium">Selected:</span>
                <span className="font-bold text-[#714B67] font-mono">
                  {totalSelected} / {staffList.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-right">
                <span className="text-slate-500 font-medium">Monthly Wages:</span>
                <span className="font-extrabold text-emerald-700 font-mono">
                  {formatCurrency(totalMonthlyWage, 'INR')}
                </span>
                {hourlyCount > 0 && (
                  <span className="text-purple-700 font-semibold font-mono text-[11px] ml-1">
                    (+{hourlyCount} hourly @ {formatCurrency(totalHourlyWage, 'INR')}/hr)
                  </span>
                )}
              </div>
            </div>

            {/* Employee Records Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <Checkbox
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Contract & Structure</th>
                    <th className="p-3">Schedule</th>
                    <th className="p-3 text-right">Wage Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedStaff.length > 0 ? (
                    displayedStaff.map((staff) => {
                      const isChecked = selectedEmployees.includes(staff.id);
                      return (
                        <tr
                          key={staff.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            !staff.hasActiveContract
                              ? 'opacity-60 bg-slate-50/50 cursor-not-allowed'
                              : isChecked
                              ? 'bg-[#714B67]/5 cursor-pointer'
                              : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            if (staff.hasActiveContract) toggleEmployee(staff.id);
                          }}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isChecked}
                              disabled={!staff.hasActiveContract}
                              onChange={() => {
                                if (staff.hasActiveContract) toggleEmployee(staff.id);
                              }}
                            />
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-900 block leading-tight">{staff.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{staff.code}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap items-center gap-1">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                staff.isHourly
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {staff.contractType}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                {staff.structureName}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600">{staff.hours}</td>
                          <td className="p-3 text-right">
                            {staff.hasActiveContract ? (
                              <div>
                                <span className="font-bold text-slate-900 font-mono">
                                  {formatCurrency(staff.wage, 'INR')}
                                </span>
                                <span className="text-[10px] text-slate-500 font-normal ml-1">
                                  / {staff.isHourly ? 'hr' : 'mo'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-amber-600 font-medium text-[11px]">No Contract</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No employees found matching filter.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-semibold text-slate-800 border-t-2 border-slate-200 sticky bottom-0 z-10">
                  <tr>
                    <td className="p-3 text-center">
                      <span className="text-[10px] text-slate-400 font-mono uppercase">Total</span>
                    </td>
                    <td className="p-3" colSpan={3}>
                      <span>Selected ({totalSelected} employee{totalSelected !== 1 ? 's' : ''})</span>
                    </td>
                    <td className="p-3 text-right font-extrabold text-emerald-700 text-sm font-mono">
                      {formatCurrency(totalMonthlyWage, 'INR')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Participant Note */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Participant note:</strong> user selects one or more eligible employees, then clicks Create Payrun. The created Payrun should contain only the selected employees.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => setModalStep(1)}>
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleCloseModal}>
                  Discard
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={createPayrunMutation.isPending}
                  onClick={handleCreatePayrun}
                >
                  Create payrun
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
