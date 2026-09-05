# No Static or Mock Data in Frontend

## Critical Directives
1. **Never use static or mock fallback data**:
   - Do NOT define or import dummy arrays or objects (such as `DEFAULT_EMPLOYEES`, `DEFAULT_ATTENDANCE_LOGS`, `DEFAULT_LEAVE_REQUESTS`, `DEFAULT_CONTRACTS`, `DEFAULT_PAYSLIPS`).
   - Do NOT hardcode placeholder numbers, strings, or fake entities in JSX (e.g. `|| 'Sarah Connor'`, `|| 6500`, `|| 'EMP-001'`).
   - Always display genuine data returned by the backend APIs.

2. **Handle Empty and Loading States Gracefully**:
   - When an API returns an empty list `[]` or null, render realistic empty states (e.g., "No records found", "No active contract", "—", or 0).
   - If a request fails, surface the error message or an empty state; NEVER fall back to offline demo objects.

3. **Strict Role and Data Isolation**:
   - Standard users/employees (`ROLE_USER`) must ONLY see their own personal records (personal payslips, attendance, leave requests, profile, contract wage).
   - Never expose company-wide ERP aggregations or other employees' personal details to regular employees.
