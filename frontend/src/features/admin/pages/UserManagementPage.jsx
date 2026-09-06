// Deprecated: User management, role changes, password updates, and packages have been consolidated directly into Employee profile.
import React from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';

export function UserManagementPage() {
  return <Navigate to={ROUTES.EMPLOYEES} replace />;
}

export default UserManagementPage;
