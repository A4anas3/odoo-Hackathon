package com.odoo.hr.config;

import com.odoo.hr.attendance.model.Attendance;
import com.odoo.hr.attendance.repository.AttendanceRepository;
import com.odoo.hr.contract.model.Contract;
import com.odoo.hr.contract.repository.ContractRepository;
import com.odoo.hr.employee.model.Employee;
import com.odoo.hr.employee.repository.EmployeeRepository;
import com.odoo.hr.organization.model.Department;
import com.odoo.hr.organization.model.JobPosition;
import com.odoo.hr.organization.repository.DepartmentRepository;
import com.odoo.hr.organization.repository.JobPositionRepository;
import com.odoo.hr.payroll.model.Payrun;
import com.odoo.hr.payroll.model.Payslip;
import com.odoo.hr.payroll.model.PayslipLine;
import com.odoo.hr.payroll.repository.PayrunRepository;
import com.odoo.hr.payroll.repository.PayslipLineRepository;
import com.odoo.hr.payroll.repository.PayslipRepository;
import com.odoo.hr.salary.model.SalaryRule;
import com.odoo.hr.salary.model.SalaryStructure;
import com.odoo.hr.salary.repository.SalaryRuleRepository;
import com.odoo.hr.salary.repository.SalaryStructureRepository;
import com.odoo.hr.schedule.model.WorkingSchedule;
import com.odoo.hr.schedule.model.WorkingScheduleDay;
import com.odoo.hr.schedule.repository.WorkingScheduleRepository;
import com.odoo.hr.timeoff.model.TimeOffAllocation;
import com.odoo.hr.timeoff.model.TimeOffRequest;
import com.odoo.hr.timeoff.model.TimeOffType;
import com.odoo.hr.timeoff.repository.TimeOffAllocationRepository;
import com.odoo.hr.timeoff.repository.TimeOffRequestRepository;
import com.odoo.hr.timeoff.repository.TimeOffTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final JobPositionRepository jobPositionRepository;
    private final EmployeeRepository employeeRepository;
    private final ContractRepository contractRepository;
    private final WorkingScheduleRepository workingScheduleRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final SalaryRuleRepository salaryRuleRepository;
    private final AttendanceRepository attendanceRepository;
    private final TimeOffTypeRepository timeOffTypeRepository;
    private final TimeOffAllocationRepository timeOffAllocationRepository;
    private final TimeOffRequestRepository timeOffRequestRepository;
    private final PayrunRepository payrunRepository;
    private final PayslipRepository payslipRepository;
    private final PayslipLineRepository payslipLineRepository;

    @Override
    public void run(String... args) {
        log.info("Checking HRMS database state for seed initialization...");
        seedAllData();
    }

    @Transactional
    public Map<String, Object> seedAllData() {
        log.info("Executing comprehensive idempotent HRMS database seeding...");

        // 1. Departments
        Department deptEng = getOrCreateDepartment("Engineering", "Software architecture, web applications, and backend infrastructure");
        Department deptHr = getOrCreateDepartment("Human Resources", "Talent acquisition, payroll management, and people operations");
        Department deptSales = getOrCreateDepartment("Sales", "Global revenue, enterprise sales, and customer relations");
        Department deptMkt = getOrCreateDepartment("Marketing", "Brand positioning, performance marketing, and digital outreach");
        Department deptFin = getOrCreateDepartment("Finance", "Corporate accounting, budgeting, and statutory compliance");

        // 2. Job Positions
        JobPosition jobDev = getOrCreateJobPosition("Senior Fullstack Engineer", deptEng, "Builds scalable React webapps and Spring Boot microservices");
        JobPosition jobOps = getOrCreateJobPosition("DevOps & Cloud Architect", deptEng, "Manages CI/CD pipelines, Docker, Kubernetes and PostgreSQL clusters");
        JobPosition jobQa = getOrCreateJobPosition("QA Automation Engineer", deptEng, "Designs test suites, automated integration testing, and quality assurance");
        JobPosition jobHrDir = getOrCreateJobPosition("HR Director", deptHr, "Leads company-wide human resource strategy and employee satisfaction");
        JobPosition jobSalesExec = getOrCreateJobPosition("Senior Account Executive", deptSales, "Drives B2B enterprise software contracts and customer acquisition");
        JobPosition jobMktLead = getOrCreateJobPosition("Marketing Lead", deptMkt, "Orchestrates brand campaigns, social media, and product launches");
        JobPosition jobFinCtrl = getOrCreateJobPosition("Financial Controller", deptFin, "Supervises financial reporting, accounts ledger, and payroll disbursements");

        // 3. Working Schedule
        WorkingSchedule schedule40 = getOrCreateWorkingSchedule("Standard 40h (Mon-Fri 09:00-18:00)", "Standard full-time schedule with 1 hour lunch break");

        // 4. Salary Structures & Rules
        SalaryStructure structRegular = getOrCreateSalaryStructure("Regular Full-Time", "Standard full-time salary package with basic, HRA, allowances, and tax deductions");
        SalaryStructure structExec = getOrCreateSalaryStructure("Executive Management", "Executive compensation package with performance allowances");
        SalaryStructure structSales = getOrCreateSalaryStructure("Sales Commission Base", "Base salary structure with commission incentives for sales team");

        // Ensure Rules for structRegular
        ensureSalaryRule(structRegular, "Basic Salary", "BASIC", 1, "BASIC", "PERCENTAGE", new BigDecimal("50.00"), "contract.wage * 0.50");
        ensureSalaryRule(structRegular, "House Rent Allowance (HRA)", "HRA", 2, "ALW", "PERCENTAGE", new BigDecimal("25.00"), "contract.wage * 0.25");
        ensureSalaryRule(structRegular, "Transport Conveyance", "TRANS", 3, "ALW", "FIXED", new BigDecimal("300.00"), "300");
        ensureSalaryRule(structRegular, "Gross Salary", "GROSS", 4, "GROSS", "FORMULA", null, "BASIC + HRA + TRANS");
        ensureSalaryRule(structRegular, "Income Tax Withholding (10%)", "TAX", 5, "DED", "PERCENTAGE", new BigDecimal("10.00"), "GROSS * 0.10");
        ensureSalaryRule(structRegular, "Provident Fund (5%)", "PF", 6, "DED", "PERCENTAGE", new BigDecimal("5.00"), "BASIC * 0.05");
        ensureSalaryRule(structRegular, "Net Pay", "NET", 7, "NET", "FORMULA", null, "GROSS - TAX - PF");

        // 5. Employees (Mirrors 1-click Demo accounts)
        Employee empSarah = getOrCreateEmployee(
                "admin@company.com", "EMP-001", "Sarah", "Connor", "admin@company.com", "+1 555-0101",
                LocalDate.of(1990, 5, 12), "742 Evergreen Terrace, Springfield", deptEng, jobDev,
                LocalDate.of(2023, 1, 15), "US98234710293847", "Chase Bank", "CHASUS33"
        );

        Employee empMichael = getOrCreateEmployee(
                "hrmanager@company.com", "EMP-002", "Michael", "Scott", "hrmanager@company.com", "+1 555-0102",
                LocalDate.of(1982, 3, 15), "1725 Slough Avenue, Scranton, PA", deptHr, jobHrDir,
                LocalDate.of(2022, 6, 1), "US12389471928374", "Wells Fargo", "WFBIUS6S"
        );

        Employee empDwight = getOrCreateEmployee(
                "employee@company.com", "EMP-003", "Dwight", "Schrute", "employee@company.com", "+1 555-0103",
                LocalDate.of(1985, 1, 20), "Schrute Farms, Honesdale, PA", deptSales, jobSalesExec,
                LocalDate.of(2022, 9, 10), "US48291039482716", "PNC Bank", "PNCCUS33"
        );

        Employee empPam = getOrCreateEmployee(
                "pam@company.com", "EMP-004", "Pam", "Beesly", "pam@company.com", "+1 555-0104",
                LocalDate.of(1988, 3, 25), "42 Elm Street, Scranton, PA", deptMkt, jobMktLead,
                LocalDate.of(2023, 3, 1), "US71928340192837", "Bank of America", "BOFAUS3N"
        );

        Employee empJim = getOrCreateEmployee(
                "jim@company.com", "EMP-005", "Jim", "Halpert", "jim@company.com", "+1 555-0105",
                LocalDate.of(1987, 10, 1), "12 Oak Avenue, Scranton, PA", deptEng, jobOps,
                LocalDate.of(2023, 2, 15), "US62910384729102", "Citibank", "CITIUS33"
        );

        Employee empAlice = getOrCreateEmployee(
                "alice@example.com", "EMP-006", "Alice", "Smith", "alice@example.com", "+1 555-0106",
                LocalDate.of(1994, 8, 18), "221B Baker Street, London Tech Hub", deptEng, jobQa,
                LocalDate.of(2023, 5, 20), "US88392019482910", "Barclays Bank", "BARCUS22"
        );

        Employee empArthur = getOrCreateEmployee(
                "admin@odoo.com", "EMP-007", "Arthur", "Dent", "admin@odoo.com", "+1 555-0107",
                LocalDate.of(1986, 4, 11), "15 Cottington Lane, Cottington", deptEng, jobDev,
                LocalDate.of(2022, 1, 10), "US33491029384918", "Chase Bank", "CHASUS33"
        );

        Employee empRachel = getOrCreateEmployee(
                "manager@odoo.com", "EMP-008", "Rachel", "Green", "manager@odoo.com", "+1 555-0108",
                LocalDate.of(1991, 11, 24), "495 Grove Street, New York, NY", deptHr, jobHrDir,
                LocalDate.of(2022, 8, 15), "US44819203948192", "Capital One", "CAPONE11"
        );

        // Assign Department Managers
        deptEng.setManager(empSarah);
        deptHr.setManager(empMichael);
        deptSales.setManager(empDwight);
        deptMkt.setManager(empPam);
        deptFin.setManager(empSarah);
        departmentRepository.saveAll(List.of(deptEng, deptHr, deptSales, deptMkt, deptFin));

        // 6. Contracts
        Contract cSarah = getOrCreateContract(empSarah, "PERMANENT", LocalDate.of(2023, 1, 15), new BigDecimal("6500.00"), structRegular, schedule40);
        Contract cMichael = getOrCreateContract(empMichael, "PERMANENT", LocalDate.of(2022, 6, 1), new BigDecimal("8200.00"), structExec, schedule40);
        Contract cDwight = getOrCreateContract(empDwight, "PERMANENT", LocalDate.of(2022, 9, 10), new BigDecimal("5400.00"), structSales, schedule40);
        Contract cPam = getOrCreateContract(empPam, "PERMANENT", LocalDate.of(2023, 3, 1), new BigDecimal("4800.00"), structRegular, schedule40);
        Contract cJim = getOrCreateContract(empJim, "PERMANENT", LocalDate.of(2023, 2, 15), new BigDecimal("7000.00"), structRegular, schedule40);
        Contract cAlice = getOrCreateContract(empAlice, "PERMANENT", LocalDate.of(2023, 5, 20), new BigDecimal("5200.00"), structRegular, schedule40);
        Contract cArthur = getOrCreateContract(empArthur, "PERMANENT", LocalDate.of(2022, 1, 10), new BigDecimal("6800.00"), structRegular, schedule40);
        Contract cRachel = getOrCreateContract(empRachel, "PERMANENT", LocalDate.of(2022, 8, 15), new BigDecimal("7500.00"), structExec, schedule40);

        // 7. Time Off Types & Allocations
        TimeOffType typeAnnual = getOrCreateTimeOffType("Annual Paid Leave", "Standard paid time off allocation", true, true);
        TimeOffType typeSick = getOrCreateTimeOffType("Sick Leave", "Medical leave for illness and health appointments", true, false);
        TimeOffType typeUnpaid = getOrCreateTimeOffType("Unpaid Leave", "Leave of absence without compensation", false, true);

        List<Employee> allEmployees = List.of(empSarah, empMichael, empDwight, empPam, empJim, empAlice, empArthur, empRachel);
        LocalDate yearStart = LocalDate.of(2026, 1, 1);
        LocalDate yearEnd = LocalDate.of(2026, 12, 31);

        for (Employee emp : allEmployees) {
            getOrCreateAllocation(emp, typeAnnual, yearStart, yearEnd, new BigDecimal("24.00"), new BigDecimal("2.00"), new BigDecimal("22.00"));
            getOrCreateAllocation(emp, typeSick, yearStart, yearEnd, new BigDecimal("12.00"), BigDecimal.ZERO, new BigDecimal("12.00"));
        }

        // Leave Requests
        ensureLeaveRequest(empDwight, typeSick, LocalDate.now().plusDays(2), LocalDate.now().plusDays(3), new BigDecimal("2.00"), "Dental surgery recovery", "PENDING", null);
        ensureLeaveRequest(empPam, typeAnnual, LocalDate.now().plusDays(10), LocalDate.now().plusDays(12), new BigDecimal("3.00"), "Family vacation trip", "APPROVED", empMichael);
        ensureLeaveRequest(empJim, typeAnnual, LocalDate.now().plusDays(5), LocalDate.now().plusDays(7), new BigDecimal("3.00"), "Personal retreat", "APPROVED", empSarah);
        ensureLeaveRequest(empAlice, typeAnnual, LocalDate.now().plusDays(14), LocalDate.now().plusDays(18), new BigDecimal("5.00"), "Annual holiday leave", "PENDING", null);

        // 8. Attendance Logs for Today
        LocalDate today = LocalDate.now();
        ensureTodayAttendance(empSarah, today, 9, 2, "PRESENT");
        ensureTodayAttendance(empMichael, today, 9, 30, "PRESENT");
        ensureTodayAttendance(empJim, today, 8, 55, "PRESENT");
        ensureTodayAttendance(empAlice, today, 9, 0, "PRESENT");
        ensureTodayAttendance(empArthur, today, 9, 10, "PRESENT");

        // 9. Payrun & Payslips
        Payrun payrunSep = getOrCreatePayrun(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), structRegular, "PAID", "admin@company.com");

        ensurePayslipWithLines(payrunSep, empSarah, cSarah, structRegular, new BigDecimal("6500.00"), new BigDecimal("812.50"), new BigDecimal("5687.50"));
        ensurePayslipWithLines(payrunSep, empMichael, cMichael, structExec, new BigDecimal("8200.00"), new BigDecimal("1025.00"), new BigDecimal("7175.00"));
        ensurePayslipWithLines(payrunSep, empDwight, cDwight, structSales, new BigDecimal("5400.00"), new BigDecimal("675.00"), new BigDecimal("4725.00"));
        ensurePayslipWithLines(payrunSep, empPam, cPam, structRegular, new BigDecimal("4800.00"), new BigDecimal("600.00"), new BigDecimal("4200.00"));
        ensurePayslipWithLines(payrunSep, empJim, cJim, structRegular, new BigDecimal("7000.00"), new BigDecimal("875.00"), new BigDecimal("6125.00"));
        ensurePayslipWithLines(payrunSep, empAlice, cAlice, structRegular, new BigDecimal("5200.00"), new BigDecimal("650.00"), new BigDecimal("4550.00"));

        Map<String, Object> summary = new HashMap<>();
        summary.put("status", "SUCCESS");
        summary.put("departmentsCount", departmentRepository.count());
        summary.put("jobPositionsCount", jobPositionRepository.count());
        summary.put("employeesCount", employeeRepository.count());
        summary.put("contractsCount", contractRepository.count());
        summary.put("payrunsCount", payrunRepository.count());
        summary.put("payslipsCount", payslipRepository.count());
        summary.put("timeoffRequestsCount", timeOffRequestRepository.count());
        summary.put("attendanceCount", attendanceRepository.count());

        log.info("Comprehensive HRMS seeding completed successfully: {}", summary);
        return summary;
    }

    // --- Helper Methods for Idempotent Seeding ---

    private Department getOrCreateDepartment(String name, String description) {
        return departmentRepository.findByName(name).orElseGet(() ->
                departmentRepository.save(Department.builder()
                        .name(name)
                        .description(description)
                        .status("ACTIVE")
                        .build())
        );
    }

    private JobPosition getOrCreateJobPosition(String title, Department dept, String description) {
        return jobPositionRepository.findByTitle(title).orElseGet(() ->
                jobPositionRepository.save(JobPosition.builder()
                        .title(title)
                        .department(dept)
                        .description(description)
                        .status("ACTIVE")
                        .build())
        );
    }

    private WorkingSchedule getOrCreateWorkingSchedule(String name, String description) {
        return workingScheduleRepository.findAll().stream()
                .filter(s -> s.getName().equals(name))
                .findFirst()
                .orElseGet(() -> {
                    WorkingSchedule ws = workingScheduleRepository.save(WorkingSchedule.builder()
                            .name(name)
                            .description(description)
                            .build());
                    String[] weekdays = {"MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"};
                    for (String day : weekdays) {
                        WorkingScheduleDay d = WorkingScheduleDay.builder()
                                .workingSchedule(ws)
                                .weekday(day)
                                .startTime(LocalTime.of(9, 0))
                                .endTime(LocalTime.of(18, 0))
                                .breakMinutes(60)
                                .build();
                        ws.getDays().add(d);
                    }
                    return workingScheduleRepository.save(ws);
                });
    }

    private SalaryStructure getOrCreateSalaryStructure(String name, String description) {
        return salaryStructureRepository.findByName(name).orElseGet(() ->
                salaryStructureRepository.save(SalaryStructure.builder()
                        .name(name)
                        .description(description)
                        .status("ACTIVE")
                        .build())
        );
    }

    private void ensureSalaryRule(SalaryStructure structure, String name, String code, int seq, String cat, String calcType, BigDecimal pct, String formula) {
        Optional<SalaryRule> existing = salaryRuleRepository.findByCode(code);
        if (existing.isEmpty()) {
            salaryRuleRepository.save(SalaryRule.builder()
                    .salaryStructure(structure)
                    .name(name)
                    .code(code)
                    .sequence(seq)
                    .category(cat)
                    .calculationType(calcType)
                    .percentage(pct)
                    .formula(formula)
                    .active(true)
                    .build());
        }
    }

    private Employee getOrCreateEmployee(String authId, String code, String first, String last, String email, String phone,
                                        LocalDate dob, String address, Department dept, JobPosition job, LocalDate join,
                                        String bankAcc, String bankName, String ifsc) {
        return employeeRepository.findByEmail(email).orElseGet(() ->
                employeeRepository.save(Employee.builder()
                        .authProviderUserId(authId)
                        .employeeCode(code)
                        .firstName(first)
                        .lastName(last)
                        .email(email)
                        .phone(phone)
                        .dateOfBirth(dob)
                        .address(address)
                        .department(dept)
                        .jobPosition(job)
                        .joiningDate(join)
                        .employeeType("FULL_TIME")
                        .status("ACTIVE")
                        .bankAccountNo(bankAcc)
                        .bankName(bankName)
                        .ifscCode(ifsc)
                        .emergencyContactName("Office HR")
                        .emergencyContactPhone("+1 555-0100")
                        .build())
        );
    }

    private Contract getOrCreateContract(Employee emp, String type, LocalDate start, BigDecimal salary, SalaryStructure struct, WorkingSchedule schedule) {
        return contractRepository.findByEmployeeId(emp.getId()).stream()
                .filter(c -> "RUNNING".equals(c.getStatus()) || "ACTIVE".equals(c.getStatus()))
                .findFirst()
                .orElseGet(() ->
                        contractRepository.save(Contract.builder()
                                .employee(emp)
                                .contractType(type)
                                .startDate(start)
                                .salary(salary)
                                .salaryStructure(struct)
                                .workingSchedule(schedule)
                                .status("RUNNING")
                                .build())
                );
    }

    private TimeOffType getOrCreateTimeOffType(String name, String desc, boolean paid, boolean reqApproval) {
        return timeOffTypeRepository.findByName(name).orElseGet(() ->
                timeOffTypeRepository.save(TimeOffType.builder()
                        .name(name)
                        .description(desc)
                        .paid(paid)
                        .requiresApproval(reqApproval)
                        .status("ACTIVE")
                        .build())
        );
    }

    private void getOrCreateAllocation(Employee emp, TimeOffType type, LocalDate start, LocalDate end, BigDecimal alloc, BigDecimal used, BigDecimal rem) {
        Optional<TimeOffAllocation> existing = timeOffAllocationRepository.findByEmployeeIdAndTimeOffTypeId(emp.getId(), type.getId());
        if (existing.isEmpty()) {
            timeOffAllocationRepository.save(TimeOffAllocation.builder()
                    .employee(emp)
                    .timeOffType(type)
                    .periodStart(start)
                    .periodEnd(end)
                    .allocatedDays(alloc)
                    .usedDays(used)
                    .remainingDays(rem)
                    .build());
        }
    }

    private void ensureLeaveRequest(Employee emp, TimeOffType type, LocalDate start, LocalDate end, BigDecimal duration, String reason, String status, Employee approver) {
        boolean exists = timeOffRequestRepository.findByEmployeeId(emp.getId()).stream()
                .anyMatch(r -> r.getStartDate().equals(start));
        if (!exists) {
            timeOffRequestRepository.save(TimeOffRequest.builder()
                    .employee(emp)
                    .timeOffType(type)
                    .startDate(start)
                    .endDate(end)
                    .duration(duration)
                    .reason(reason)
                    .status(status)
                    .approvedBy(approver)
                    .approvedAt(approver != null ? OffsetDateTime.now() : null)
                    .build());
        }
    }

    private void ensureTodayAttendance(Employee emp, LocalDate date, int hour, int min, String status) {
        Optional<Attendance> existing = attendanceRepository.findByEmployeeIdAndAttendanceDate(emp.getId(), date);
        if (existing.isEmpty()) {
            attendanceRepository.save(Attendance.builder()
                    .employee(emp)
                    .attendanceDate(date)
                    .checkIn(OffsetDateTime.now().withHour(hour).withMinute(min))
                    .scheduledHours(new BigDecimal("8.00"))
                    .overtimeHours(BigDecimal.ZERO)
                    .lateMinutes(0)
                    .status(status)
                    .build());
        }
    }

    private Payrun getOrCreatePayrun(LocalDate start, LocalDate end, SalaryStructure struct, String status, String createdBy) {
        return payrunRepository.findAll().stream()
                .filter(p -> p.getPeriodStart().equals(start) && p.getPeriodEnd().equals(end))
                .findFirst()
                .orElseGet(() ->
                        payrunRepository.save(Payrun.builder()
                                .periodStart(start)
                                .periodEnd(end)
                                .salaryStructure(struct)
                                .status(status)
                                .createdBy(createdBy)
                                .calculatedAt(OffsetDateTime.now().minusDays(5))
                                .validatedAt(OffsetDateTime.now().minusDays(3))
                                .paidAt(OffsetDateTime.now().minusDays(1))
                                .build())
                );
    }

    private void ensurePayslipWithLines(Payrun payrun, Employee emp, Contract contract, SalaryStructure struct, BigDecimal gross, BigDecimal ded, BigDecimal net) {
        Optional<Payslip> existing = payslipRepository.findByPayrunId(payrun.getId()).stream()
                .filter(p -> p.getEmployee().getId().equals(emp.getId()))
                .findFirst();

        if (existing.isEmpty()) {
            Payslip ps = payslipRepository.save(Payslip.builder()
                    .payrun(payrun)
                    .employee(emp)
                    .contract(contract)
                    .salaryStructure(struct)
                    .periodStart(payrun.getPeriodStart())
                    .periodEnd(payrun.getPeriodEnd())
                    .grossSalary(gross)
                    .totalDeductions(ded)
                    .netSalary(net)
                    .status("PAID")
                    .build());

            BigDecimal basic = gross.multiply(new BigDecimal("0.50"));
            BigDecimal hra = gross.multiply(new BigDecimal("0.25"));
            BigDecimal trans = new BigDecimal("300.00");
            BigDecimal tax = gross.multiply(new BigDecimal("0.10"));
            BigDecimal pf = basic.multiply(new BigDecimal("0.05"));

            payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("BASIC").ruleName("Basic Salary").category("BASIC").amount(basic).sequence(1).build());
            payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("HRA").ruleName("House Rent Allowance (HRA)").category("ALW").amount(hra).sequence(2).build());
            payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("TRANS").ruleName("Transport Conveyance").category("ALW").amount(trans).sequence(3).build());
            payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("TAX").ruleName("Income Tax Withholding (10%)").category("DED").amount(tax).sequence(4).build());
            payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("PF").ruleName("Provident Fund (5%)").category("DED").amount(pf).sequence(5).build());
        }
    }
}
