import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ROUTES } from '../config/routes';

// Auth
import { LoginPage } from '../features/auth/pages/LoginPage';

// Dashboard
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';

// Employees & Organization
import { EmployeeListPage } from '../features/employees/pages/EmployeeListPage';
import { EmployeeDetailPage } from '../features/employees/pages/EmployeeDetailPage';
import { EmployeeFormPage } from '../features/employees/pages/EmployeeFormPage';
import { DepartmentListPage } from '../features/departments/pages/DepartmentListPage';
import { JobPositionListPage } from '../features/jobPositions/pages/JobPositionListPage';

// Contracts & Schedules
import { ContractListPage } from '../features/contracts/pages/ContractListPage';
import { ContractFormPage } from '../features/contracts/pages/ContractFormPage';
import { ScheduleEditorPage } from '../features/schedules/pages/ScheduleEditorPage';

// Attendance
import { AttendancePage } from '../features/attendance/pages/AttendancePage';
import { AttendanceDetailPage } from '../features/attendance/pages/AttendanceDetailPage';

// Time Off
import { TimeOffPage } from '../features/timeoff/pages/TimeOffPage';
import { TimeOffRequestsPage } from '../features/timeoff/pages/TimeOffRequestsPage';
import { TimeOffRequestDetailPage } from '../features/timeoff/pages/TimeOffRequestDetailPage';
import { AllocationsListPage } from '../features/timeoff/pages/AllocationsListPage';
import { AllocationDetailPage } from '../features/timeoff/pages/AllocationDetailPage';
import { TimeOffTypesListPage } from '../features/timeoff/pages/TimeOffTypesListPage';
import { TimeOffTypeDetailPage } from '../features/timeoff/pages/TimeOffTypeDetailPage';

// Salary
import { SalaryStructureListPage } from '../features/salary/structures/pages/SalaryStructureListPage';
import { SalaryStructureDetailPage } from '../features/salary/structures/pages/SalaryStructureDetailPage';
import { SalaryRuleBuilderPage } from '../features/salary/rules/pages/SalaryRuleBuilderPage';
import { SalaryRuleDetailPage } from '../features/salary/rules/pages/SalaryRuleDetailPage';

// Payroll & Payruns
import { PayrollDashboardPage } from '../features/payroll/dashboard/pages/PayrollDashboardPage';
import { PayrunListPage } from '../features/payroll/payruns/pages/PayrunListPage';
import { PayrunWizardPage } from '../features/payroll/payruns/pages/PayrunWizardPage';
import { PayrunDetailPage } from '../features/payroll/payruns/pages/PayrunDetailPage';
import { PayslipListPage } from '../features/payroll/payslips/pages/PayslipListPage';
import { PayslipDetailPage } from '../features/payroll/payslips/pages/PayslipDetailPage';

// Profile
import { ProfilePage } from '../features/profile/pages/ProfilePage';

export const router = createBrowserRouter([
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.DASHBOARD} replace />,
      },
      {
        path: ROUTES.DASHBOARD,
        element: <DashboardPage />,
      },
      {
        path: ROUTES.EMPLOYEES,
        element: <EmployeeListPage />,
      },
      {
        path: ROUTES.EMPLOYEE_NEW,
        element: <EmployeeFormPage />,
      },
      {
        path: '/employees/:id',
        element: <EmployeeDetailPage />,
      },
      {
        path: '/employees/:id/edit',
        element: <EmployeeFormPage />,
      },
      {
        path: ROUTES.DEPARTMENTS,
        element: <DepartmentListPage />,
      },
      {
        path: ROUTES.JOB_POSITIONS,
        element: <JobPositionListPage />,
      },
      {
        path: ROUTES.CONTRACTS,
        element: <ContractListPage />,
      },
      {
        path: ROUTES.CONTRACT_NEW,
        element: <ContractFormPage />,
      },
      {
        path: '/contracts/:id',
        element: <ContractListPage />,
      },
      {
        path: ROUTES.SCHEDULES,
        element: <ScheduleEditorPage />,
      },
      {
        path: ROUTES.ATTENDANCE,
        element: <AttendancePage />,
      },
      {
        path: '/attendance/:id',
        element: <AttendanceDetailPage />,
      },
      {
        path: ROUTES.TIMEOFF,
        element: <TimeOffPage />,
      },
      {
        path: ROUTES.TIMEOFF_REQUESTS,
        element: <TimeOffRequestsPage />,
      },
      {
        path: '/time-off/requests/:id',
        element: <TimeOffRequestDetailPage />,
      },
      {
        path: ROUTES.TIMEOFF_ALLOCATIONS,
        element: <AllocationsListPage />,
      },
      {
        path: '/time-off/allocations/:id',
        element: <AllocationDetailPage />,
      },
      {
        path: ROUTES.TIMEOFF_TYPES,
        element: <TimeOffTypesListPage />,
      },
      {
        path: '/time-off/types/:id',
        element: <TimeOffTypeDetailPage />,
      },
      {
        path: ROUTES.SALARY_STRUCTURES,
        element: <SalaryStructureListPage />,
      },
      {
        path: '/salary/structures/:id',
        element: <SalaryStructureDetailPage />,
      },
      {
        path: ROUTES.SALARY_RULES,
        element: <SalaryRuleBuilderPage />,
      },
      {
        path: '/salary/rules/:id',
        element: <SalaryRuleDetailPage />,
      },
      {
        path: '/payroll',
        element: <Navigate to={ROUTES.PAYROLL_DASHBOARD} replace />,
      },
      {
        path: ROUTES.PAYROLL_DASHBOARD,
        element: <PayrollDashboardPage />,
      },
      {
        path: ROUTES.PAYRUNS,
        element: <PayrunListPage />,
      },
      {
        path: ROUTES.PAYRUN_NEW,
        element: <PayrunListPage />,
      },
      {
        path: '/payroll/payruns/:id',
        element: <PayrunDetailPage />,
      },
      {
        path: ROUTES.PAYSLIPS,
        element: <PayslipListPage />,
      },
      {
        path: '/payroll/payslips/:id',
        element: <PayslipDetailPage />,
      },

      {
        path: ROUTES.PROFILE,
        element: <ProfilePage />,
      },

    ],
  },
  {
    path: '*',
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
]);
