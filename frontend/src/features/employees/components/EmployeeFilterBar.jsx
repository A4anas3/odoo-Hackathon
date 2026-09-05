import React from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/form/Input';
import { Select } from '../../../components/form/Select';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';

export function EmployeeFilterBar({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  status,
  onStatusChange,
  type,
  onTypeChange,
  canCreate = true,
}) {
  const departmentOptions = [
    { value: 'ALL', label: 'All Departments' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Management', label: 'Management' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Finance', label: 'Finance' },
  ];

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'ON_LEAVE', label: 'On Leave' },
    { value: 'INACTIVE', label: 'Inactive' },
  ];

  const typeOptions = [
    { value: 'ALL', label: 'All Types' },
    { value: 'FULL_TIME', label: 'Full Time' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'CONTRACTOR', label: 'Contractor' },
    { value: 'INTERN', label: 'Intern' },
  ];

  return (
    <div className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      {/* Filters Left */}
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search employees by name, code, email..."
            icon={Search}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="w-40">
          <Select
            options={departmentOptions}
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
          />
        </div>

        <div className="w-36">
          <Select
            options={statusOptions}
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          />
        </div>

        <div className="w-36">
          <Select
            options={typeOptions}
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
          />
        </div>
      </div>

      {/* Action Right */}
      {canCreate && (
        <div className="shrink-0">
          <Link to={ROUTES.EMPLOYEE_NEW}>
            <Button variant="primary" size="sm" icon={Plus}>
              New Employee
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
