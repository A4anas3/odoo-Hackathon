export const ROLES = {
  ADMIN: 'ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  HR_PAYROLL_MANAGER: 'HR_PAYROLL_MANAGER',
  HR_PAYROLL_USER: 'HR_PAYROLL_USER',
  EMPLOYEE: 'EMPLOYEE',
};

/**
 * Checks if a user has at least one of the required roles.
 */
export function hasRequiredRole(userRoles = [], requiredRoles = []) {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  if (!userRoles || userRoles.length === 0) return false;
  
  // Normalizing ROLE_ADMIN or ADMIN
  const normalizedUserRoles = userRoles.map(r => r.replace(/^ROLE_/, ''));
  
  // ADMIN has full access
  if (normalizedUserRoles.includes(ROLES.ADMIN)) return true;
  
  return requiredRoles.some(role => normalizedUserRoles.includes(role.replace(/^ROLE_/, '')));
}

export const PERMISSIONS = {
  CAN_MANAGE_EMPLOYEES: [ROLES.ADMIN, ROLES.HR_MANAGER],
  CAN_MANAGE_CONTRACTS: [ROLES.ADMIN, ROLES.HR_MANAGER],
  CAN_MANAGE_SCHEDULES: [ROLES.ADMIN, ROLES.HR_MANAGER],
  CAN_MANAGE_ATTENDANCE: [ROLES.ADMIN, ROLES.HR_MANAGER],
  CAN_APPROVE_LEAVE: [ROLES.ADMIN, ROLES.HR_MANAGER],
  CAN_MANAGE_SALARY_STRUCTURES: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER],
  CAN_RUN_PAYROLL: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER],
  CAN_VALIDATE_PAYROLL: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER],
  CAN_VIEW_REPORTS: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER],
  CAN_ACCESS_ADMIN: [ROLES.ADMIN],
};
