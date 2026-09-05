export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  
  EMPLOYEES: '/employees',
  EMPLOYEE_NEW: '/employees/new',
  EMPLOYEE_DETAIL: (id = ':id') => `/employees/${id}`,
  EMPLOYEE_EDIT: (id = ':id') => `/employees/${id}/edit`,
  
  DEPARTMENTS: '/departments',
  JOB_POSITIONS: '/job-positions',
  
  CONTRACTS: '/contracts',
  CONTRACT_NEW: '/contracts/new',
  CONTRACT_DETAIL: (id = ':id') => `/contracts/${id}`,
  
  SCHEDULES: '/schedules',
  
  ATTENDANCE: '/attendance',
  
  TIMEOFF: '/time-off',
  TIMEOFF_REQUESTS: '/time-off/requests',
  TIMEOFF_ALLOCATIONS: '/time-off/allocations',
  
  SALARY_STRUCTURES: '/salary/structures',
  SALARY_STRUCTURE_DETAIL: (id = ':id') => `/salary/structures/${id}`,
  SALARY_RULES: '/salary/rules',
  
  PAYRUNS: '/payroll/payruns',
  PAYRUN_NEW: '/payroll/payruns/new',
  PAYRUN_DETAIL: (id = ':id') => `/payroll/payruns/${id}`,
  
  PAYSLIPS: '/payroll/payslips',
  PAYSLIP_DETAIL: (id = ':id') => `/payroll/payslips/${id}`,
  
  REPORTS: '/reports',
  PROFILE: '/profile',
  ADMIN: '/admin',
};
