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
  ATTENDANCE_DETAIL: (id = ':id') => `/attendance/${id}`,
  
  TIMEOFF: '/time-off',
  TIMEOFF_REQUESTS: '/time-off/requests',
  TIMEOFF_REQUEST_DETAIL: (id = ':id') => `/time-off/requests/${id}`,
  TIMEOFF_ALLOCATIONS: '/time-off/allocations',
  TIMEOFF_ALLOCATION_DETAIL: (id = ':id') => `/time-off/allocations/${id}`,
  TIMEOFF_TYPES: '/time-off/types',
  TIMEOFF_TYPE_DETAIL: (id = ':id') => `/time-off/types/${id}`,
  
  SALARY_STRUCTURES: '/salary/structures',
  SALARY_STRUCTURE_DETAIL: (id = ':id') => `/salary/structures/${id}`,
  SALARY_RULES: '/salary/rules',
  SALARY_RULE_DETAIL: (id = ':id') => `/salary/rules/${id}`,
  
  PAYROLL_DASHBOARD: '/payroll/dashboard',
  PAYRUNS: '/payroll/payruns',
  PAYRUN_NEW: '/payroll/payruns/new',
  PAYRUN_DETAIL: (id = ':id') => `/payroll/payruns/${id}`,
  
  PAYSLIPS: '/payroll/payslips',
  PAYSLIP_DETAIL: (id = ':id') => `/payroll/payslips/${id}`,
  
  PROFILE: '/profile',
};
