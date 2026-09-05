export const ROLES = {
  ADMIN: 'ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  MANAGER: 'MANAGER',
  HR: 'HR',
  HR_PAYROLL_MANAGER: 'HR_PAYROLL_MANAGER',
  HR_PAYROLL_USER: 'HR_PAYROLL_USER',
  EMPLOYEE: 'EMPLOYEE',
  USER: 'USER',
};

/**
 * Checks if a user has at least one of the required roles.
 * Admins, HR Managers, and Managers have full access across all platform features.
 */
export function hasRequiredRole(userRoles = [], requiredRoles = []) {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  if (!userRoles || userRoles.length === 0) return false;
  
  // Normalizing ROLE_ADMIN or ADMIN to uppercase
  const normalizedUserRoles = userRoles.map((r) => String(r || '').replace(/^ROLE_/, '').toUpperCase());
  
  // ADMIN, HR_MANAGER, MANAGER, and HR have complete operational access like Admin
  const hasFullAccess = normalizedUserRoles.some((r) =>
    ['ADMIN', 'HR_MANAGER', 'MANAGER', 'HR', 'HR_PAYROLL_MANAGER'].includes(r)
  );
  if (hasFullAccess) return true;
  
  return requiredRoles.some((role) => {
    const target = String(role || '').replace(/^ROLE_/, '').toUpperCase();
    return normalizedUserRoles.includes(target);
  });
}

export const PERMISSIONS = {
  CAN_MANAGE_EMPLOYEES: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HR],
  CAN_MANAGE_CONTRACTS: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HR],
  CAN_MANAGE_SCHEDULES: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HR],
  CAN_MANAGE_ATTENDANCE: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HR],
  CAN_APPROVE_LEAVE: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HR],
  CAN_MANAGE_SALARY_STRUCTURES: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HR],
  CAN_RUN_PAYROLL: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HR],
  CAN_VALIDATE_PAYROLL: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HR],
  CAN_VIEW_REPORTS: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HR, ROLES.HR_PAYROLL_MANAGER],
  CAN_ACCESS_ADMIN: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.HR],
};
