# Repository Operating Instructions

## Frontend Data Integrity & Anti-Mocking Rule
- **No Static/Mock Data**: NEVER return, display, or fallback to mock/static demo data in the frontend. All data must originate from real backend API calls.
- **Empty States**: When data is missing, empty, or unassigned, render standard empty indicators (`"—"`, `"Not assigned"`, `0`, or empty list containers).
- **Employee Privacy & Scope**: Standard authenticated users/employees must strictly only see their own components and personal records (personal attendance, time off requests, payslips, contract, profile). They must never see other employees' records or company-wide executive ERP metrics.
