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

// Time Off
import { TimeOffPage } from '../features/timeoff/pages/TimeOffPage';
import { TimeOffRequestsPage } from '../features/timeoff/pages/TimeOffRequestsPage';

// Salary
import { SalaryStructureListPage } from '../features/salary/structures/pages/SalaryStructureListPage';
import { SalaryRuleBuilderPage } from '../features/salary/rules/pages/SalaryRuleBuilderPage';

// Payroll & Payruns
import { PayrunListPage } from '../features/payroll/payruns/pages/PayrunListPage';
import { PayrunWizardPage } from '../features/payroll/payruns/pages/PayrunWizardPage';
import { PayrunDetailPage } from '../features/payroll/payruns/pages/PayrunDetailPage';
import { PayslipListPage } from '../features/payroll/payslips/pages/PayslipListPage';
import { PayslipDetailPage } from '../features/payroll/payslips/pages/PayslipDetailPage';

// Reports, Profile & Admin
import { ReportsPage } from '../features/reports/pages/ReportsPage';
import { ProfilePage } from '../features/profile/pages/ProfilePage';
import { AdminSettingsPage } from '../features/admin/pages/AdminSettingsPage';

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
        path: ROUTES.TIMEOFF,
        element: <TimeOffPage />,
      },
      {
        path: ROUTES.TIMEOFF_REQUESTS,
        element: <TimeOffRequestsPage />,
      },
      {
        path: ROUTES.TIMEOFF_ALLOCATIONS,
        element: <TimeOffPage />,
      },
      {
        path: ROUTES.SALARY_STRUCTURES,
        element: <SalaryStructureListPage />,
      },
      {
        path: '/salary/structures/:id',
        element: <SalaryStructureListPage />,
      },
      {
        path: ROUTES.SALARY_RULES,
        element: <SalaryRuleBuilderPage />,
      },
      {
        path: ROUTES.PAYRUNS,
        element: <PayrunListPage />,
      },
      {
        path: ROUTES.PAYRUN_NEW,
        element: <PayrunWizardPage />,
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
        path: ROUTES.REPORTS,
        element: <ReportsPage />,
      },
      {
        path: ROUTES.PROFILE,
        element: <ProfilePage />,
      },
      {
        path: ROUTES.ADMIN,
        element: <AdminSettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
]);
