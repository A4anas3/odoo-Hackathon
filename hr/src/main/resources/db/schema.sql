-- ==============================================================================
-- Enterprise HR & Payroll System - Complete PostgreSQL Schema (19 Tables)
-- Architecture:
--   JWT sub -> employees.auth_provider_user_id -> employees.id
--     ├── departments & job_positions
--     ├── working_schedules & working_schedule_days
--     ├── salary_structures & salary_rules
--     ├── contracts (FK: employee_id, salary_structure_id, working_schedule_id)
--     ├── attendance (FK: employee_id, corrected_by)
--     ├── time_off_types, time_off_allocations, time_off_requests (FK: approved_by)
--     ├── payruns, payslips, payslip_lines
--     ├── email_jobs, pdf_jobs, notification_jobs
--     └── audit_logs, outbox_events
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. Organization Structure: Departments & Job Positions
-- ==============================================================================

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    manager_id UUID, -- References employees(id) (forward reference resolved below)
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_departments_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS job_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_positions_dept ON job_positions(department_id);

-- ==============================================================================
-- 2. Core HR Table: Employees
-- ==============================================================================

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_provider_user_id VARCHAR(128) NOT NULL,
    employee_code VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    date_of_birth DATE,
    address TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    job_position_id UUID REFERENCES job_positions(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    joining_date DATE,
    employee_type VARCHAR(50) DEFAULT 'FULL_TIME',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    bank_account_no VARCHAR(50),
    bank_name VARCHAR(100),
    ifsc_code VARCHAR(30),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(30),
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_employees_auth_provider_uid UNIQUE (auth_provider_user_id),
    CONSTRAINT uk_employees_email UNIQUE (email),
    CONSTRAINT uk_employees_code UNIQUE (employee_code)
);

-- Circular FK for department head
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_departments_manager'
    ) THEN
        ALTER TABLE departments 
        ADD CONSTRAINT fk_departments_manager 
        FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_job_position ON employees(job_position_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- ==============================================================================
-- 3. Working Schedules
-- ==============================================================================

CREATE TABLE IF NOT EXISTS working_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_working_schedules_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS working_schedule_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    working_schedule_id UUID NOT NULL REFERENCES working_schedules(id) ON DELETE CASCADE,
    weekday VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INTEGER DEFAULT 60,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schedule_days_schedule_id ON working_schedule_days(working_schedule_id);

-- ==============================================================================
-- 4. Salary Structures & Rules
-- ==============================================================================

CREATE TABLE IF NOT EXISTS salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_salary_structures_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS salary_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salary_structure_id UUID NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    sequence INTEGER NOT NULL DEFAULT 1,
    category VARCHAR(50) NOT NULL, -- BASIC, ALW, DED, GROSS, NET
    calculation_type VARCHAR(50) NOT NULL, -- FIXED, PERCENTAGE, FORMULA
    value NUMERIC(12, 2),
    percentage NUMERIC(5, 2),
    formula TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_salary_rules_structure ON salary_rules(salary_structure_id);
CREATE INDEX IF NOT EXISTS idx_salary_rules_code ON salary_rules(code);

-- ==============================================================================
-- 5. Contracts
-- ==============================================================================

CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    contract_type VARCHAR(50) DEFAULT 'PERMANENT',
    start_date DATE NOT NULL,
    end_date DATE,
    salary NUMERIC(12, 2) NOT NULL,
    salary_structure_id UUID REFERENCES salary_structures(id) ON DELETE SET NULL,
    working_schedule_id UUID REFERENCES working_schedules(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, RUNNING, EXPIRED, CANCELLED
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contracts_employee_id ON contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- Enforce maximum 1 active running contract per employee
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_contract 
ON contracts (employee_id) 
WHERE status = 'RUNNING';

-- ==============================================================================
-- 6. Attendance
-- ==============================================================================

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    check_in TIMESTAMPTZ NOT NULL,
    check_out TIMESTAMPTZ,
    scheduled_hours NUMERIC(5, 2) DEFAULT 8.00,
    worked_hours NUMERIC(5, 2),
    overtime_hours NUMERIC(5, 2) DEFAULT 0.00,
    late_minutes INTEGER DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'PRESENT',
    correction_reason TEXT,
    corrected_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_attendance_employee_date UNIQUE (employee_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);

-- ==============================================================================
-- 7. Time Off / Leave Management
-- ==============================================================================

CREATE TABLE IF NOT EXISTS time_off_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    paid BOOLEAN NOT NULL DEFAULT TRUE,
    requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_time_off_types_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS time_off_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    time_off_type_id UUID NOT NULL REFERENCES time_off_types(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    allocated_days NUMERIC(5, 2) NOT NULL,
    used_days NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    remaining_days NUMERIC(5, 2) NOT NULL,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_allocations_employee ON time_off_allocations(employee_id);
CREATE INDEX IF NOT EXISTS idx_allocations_type ON time_off_allocations(time_off_type_id);

CREATE TABLE IF NOT EXISTS time_off_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    time_off_type_id UUID NOT NULL REFERENCES time_off_types(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration NUMERIC(4, 1) NOT NULL,
    reason TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_time_off_requests_employee ON time_off_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_status ON time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_dates ON time_off_requests(start_date, end_date);

-- ==============================================================================
-- 8. Payroll Engine: Payruns, Payslips & Payslip Lines
-- ==============================================================================

CREATE TABLE IF NOT EXISTS payruns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    salary_structure_id UUID REFERENCES salary_structures(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, CALCULATED, VALIDATED, PAID, CANCELLED
    created_by VARCHAR(128), -- JWT sub
    calculated_at TIMESTAMPTZ,
    validated_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payruns_period ON payruns(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payruns_status ON payruns(status);

CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payrun_id UUID NOT NULL REFERENCES payruns(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
    salary_structure_id UUID REFERENCES salary_structures(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    gross_salary NUMERIC(12, 2) NOT NULL,
    total_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_salary NUMERIC(12, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    pdf_reference TEXT,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_payslips_employee_period UNIQUE (employee_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_payslips_payrun ON payslips(payrun_id);
CREATE INDEX IF NOT EXISTS idx_payslips_employee ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_status ON payslips(status);

CREATE TABLE IF NOT EXISTS payslip_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payslip_id UUID NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
    salary_rule_id UUID REFERENCES salary_rules(id) ON DELETE SET NULL,
    rule_code VARCHAR(50) NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    calculation_type VARCHAR(50),
    amount NUMERIC(12, 2) NOT NULL,
    sequence INTEGER NOT NULL DEFAULT 1,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payslip_lines_slip ON payslip_lines(payslip_id);
CREATE INDEX IF NOT EXISTS idx_payslip_lines_rule ON payslip_lines(salary_rule_id);

-- ==============================================================================
-- 9. Background Jobs: Email, PDF & Notifications (RabbitMQ / Queue Status)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS email_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    payslip_id UUID REFERENCES payslips(id) ON DELETE CASCADE,
    recipient_email VARCHAR(150) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    processing_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_jobs_status ON email_jobs(status);
CREATE INDEX IF NOT EXISTS idx_email_jobs_employee ON email_jobs(employee_id);
CREATE INDEX IF NOT EXISTS idx_email_jobs_payslip ON email_jobs(payslip_id);

CREATE TABLE IF NOT EXISTS pdf_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payslip_id UUID NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    pdf_reference TEXT,
    completed_at TIMESTAMPTZ,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pdf_jobs_status ON pdf_jobs(status);
CREATE INDEX IF NOT EXISTS idx_pdf_jobs_payslip ON pdf_jobs(payslip_id);

CREATE TABLE IF NOT EXISTS notification_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    processed_at TIMESTAMPTZ,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_jobs_status ON notification_jobs(status);
CREATE INDEX IF NOT EXISTS idx_notif_jobs_employee ON notification_jobs(employee_id);

-- ==============================================================================
-- 10. Audit & Outbox Events (Kafka / Event Streaming)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id VARCHAR(128) NOT NULL, -- JWT sub
    actor_role VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_value TEXT,
    new_value TEXT,
    metadata TEXT,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PUBLISHED, FAILED
    retry_count INTEGER NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_outbox_events_status ON outbox_events(status);
CREATE INDEX IF NOT EXISTS idx_outbox_events_aggregate ON outbox_events(aggregate_type, aggregate_id);
