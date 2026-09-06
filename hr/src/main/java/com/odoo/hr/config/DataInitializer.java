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
import com.odoo.hr.payroll.service.PayslipRedisCacheService;
import com.odoo.hr.user.config.IndianUsersDataSeeder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;

import org.springframework.core.annotation.Order;

@Slf4j
@Component
@Order(10)
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
    private final PayslipRedisCacheService payslipRedisCacheService;
    private final IndianUsersDataSeeder indianUsersDataSeeder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking HRMS database state for seed initialization...");
        resetAndSeedAllData();
    }

    @Transactional
    public Map<String, Object> resetAndSeedAllData() {
        log.info("STARTING COMPLETE HRMS TRANSACTIONAL DATA WIPE & WAGES SYSTEM RESEED...");

        // 1. Flush Redis payslip caches
        try {
            payslipRedisCacheService.revokeAll();
        } catch (Exception e) {
            log.warn("Could not evict Redis cache: {}", e.getMessage());
        }

        // 2. Batch delete transactional tables in strict foreign-key order
        payslipLineRepository.deleteAllInBatch();
        attendanceRepository.deleteAllInBatch();
        payslipRepository.deleteAllInBatch();
        payrunRepository.deleteAllInBatch();
        timeOffRequestRepository.deleteAllInBatch();
        timeOffAllocationRepository.deleteAllInBatch();
        contractRepository.deleteAllInBatch();

        log.info("Successfully wiped all transactional tables in PostgreSQL.");

        return seedAllData();
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

        // 3. Working Schedules (Matches wireframe specification)
        List<WorkingScheduleDayConfig> std5Days = List.of(
                new WorkingScheduleDayConfig("Monday", LocalTime.of(9, 0), LocalTime.of(18, 0), 60),
                new WorkingScheduleDayConfig("Tuesday", LocalTime.of(9, 0), LocalTime.of(18, 0), 60),
                new WorkingScheduleDayConfig("Wednesday", LocalTime.of(9, 0), LocalTime.of(18, 0), 60),
                new WorkingScheduleDayConfig("Thursday", LocalTime.of(9, 0), LocalTime.of(18, 0), 60),
                new WorkingScheduleDayConfig("Friday", LocalTime.of(9, 0), LocalTime.of(18, 0), 60)
        );
        WorkingSchedule schedule40 = getOrCreateWorkingSchedule(
                "40 Hours / Week", "Standard full-time weekly timetable",
                "My Company", "STANDARD", "Company Default", "ACTIVE", std5Days);

        List<WorkingScheduleDayConfig> nightShiftDays = List.of(
                new WorkingScheduleDayConfig("Monday", LocalTime.of(22, 0), LocalTime.of(7, 0), 60),
                new WorkingScheduleDayConfig("Tuesday", LocalTime.of(22, 0), LocalTime.of(7, 0), 60),
                new WorkingScheduleDayConfig("Wednesday", LocalTime.of(22, 0), LocalTime.of(7, 0), 60),
                new WorkingScheduleDayConfig("Thursday", LocalTime.of(22, 0), LocalTime.of(7, 0), 60),
                new WorkingScheduleDayConfig("Friday", LocalTime.of(22, 0), LocalTime.of(7, 0), 60)
        );
        getOrCreateWorkingSchedule(
                "Night Shift", "Overnight shift coverage",
                "My Company", "NIGHT", "Company Default", "ACTIVE", nightShiftDays);

        List<WorkingScheduleDayConfig> retailWeekendDays = List.of(
                new WorkingScheduleDayConfig("Wednesday", LocalTime.of(9, 0), LocalTime.of(18, 0), 60),
                new WorkingScheduleDayConfig("Thursday", LocalTime.of(9, 0), LocalTime.of(18, 0), 60),
                new WorkingScheduleDayConfig("Friday", LocalTime.of(9, 0), LocalTime.of(18, 0), 60),
                new WorkingScheduleDayConfig("Saturday", LocalTime.of(9, 0), LocalTime.of(18, 0), 60),
                new WorkingScheduleDayConfig("Sunday", LocalTime.of(9, 0), LocalTime.of(18, 0), 60)
        );
        getOrCreateWorkingSchedule(
                "Retail Weekend", "Weekend operational retail timetable",
                "My Company", "RETAIL", "Company Default", "ACTIVE", retailWeekendDays);

        List<WorkingScheduleDayConfig> flexHybridDays = List.of(
                new WorkingScheduleDayConfig("Monday", LocalTime.of(9, 0), LocalTime.of(17, 30), 60),
                new WorkingScheduleDayConfig("Tuesday", LocalTime.of(9, 0), LocalTime.of(17, 30), 60),
                new WorkingScheduleDayConfig("Wednesday", LocalTime.of(9, 0), LocalTime.of(17, 30), 60),
                new WorkingScheduleDayConfig("Thursday", LocalTime.of(9, 0), LocalTime.of(17, 30), 60),
                new WorkingScheduleDayConfig("Friday", LocalTime.of(9, 0), LocalTime.of(17, 30), 60)
        );
        getOrCreateWorkingSchedule(
                "Flexible Hybrid", "Flexible hours with 37.5 hours per week",
                "My Company", "FLEXIBLE", "Company Default", "ACTIVE", flexHybridDays);

        List<WorkingScheduleDayConfig> partTime20Days = List.of(
                new WorkingScheduleDayConfig("Monday", LocalTime.of(9, 0), LocalTime.of(14, 30), 30),
                new WorkingScheduleDayConfig("Tuesday", LocalTime.of(9, 0), LocalTime.of(14, 30), 30),
                new WorkingScheduleDayConfig("Wednesday", LocalTime.of(9, 0), LocalTime.of(14, 30), 30),
                new WorkingScheduleDayConfig("Thursday", LocalTime.of(9, 0), LocalTime.of(14, 30), 30)
        );
        WorkingSchedule schedulePartTime20 = getOrCreateWorkingSchedule(
                "Part-time 20h", "Half-day morning schedule",
                "My Company", "PART_TIME", "Company Default", "INACTIVE", partTime20Days);

        // 4. Salary Structures & Rules (Matches Wireframes 4, 5, 6)
        SalaryStructure structRegular = getOrCreateSalaryStructure("Regular Salary", "Standard full-time regular salary package with basic, HRA, allowances, and tax deductions");
        SalaryStructure structAdmin = getOrCreateSalaryStructure("Admin Salary", "Administrative staff salary package with office allowances");
        SalaryStructure structContractor = getOrCreateSalaryStructure("Contractor", "Hourly and milestone contractor billing structure");

        // Rules for Regular Salary matching wireframes
        ensureSalaryRule(structRegular, "Basic Salary", "BASIC", 1, "BASIC", "PERCENTAGE", new BigDecimal("50.00"), null, "contract.wage * 0.50");
        ensureSalaryRule(structRegular, "House Rent Allowance", "HRA", 10, "ALW", "PERCENTAGE", new BigDecimal("20.00"), null, "contract.wage * 0.20");
        ensureSalaryRule(structRegular, "Standard Allowance", "STD", 15, "ALW", "FIXED", null, new BigDecimal("5000.00"), "5000");
        ensureSalaryRule(structRegular, "Overtime Allowance", "OVERTIME", 18, "ALW", "FORMULA", null, null, "hourly_rate * 1.5 * overtime_hours");
        ensureSalaryRule(structRegular, "Gross Salary", "GROSS", 20, "GROSS", "FORMULA", null, null, "BASIC + HRA + STD + OVERTIME");
        ensureSalaryRule(structRegular, "Loss of Pay", "LOP", 25, "DED", "FORMULA", null, null, "daily_rate * absent_days");
        ensureSalaryRule(structRegular, "Provident Fund", "PF", 30, "DED", "PERCENTAGE", new BigDecimal("12.00"), null, "BASIC * 0.12");
        ensureSalaryRule(structRegular, "Professional Tax", "PT", 35, "DED", "FIXED", null, new BigDecimal("200.00"), "200");
        ensureSalaryRule(structRegular, "Net Salary", "NET", 100, "NET", "FORMULA", null, null, "GROSS - LOP - PF - PT");

        // Rules for Admin Salary
        ensureSalaryRule(structAdmin, "Basic Salary", "ADMIN_BASIC", 1, "BASIC", "PERCENTAGE", new BigDecimal("50.00"), null, "contract.wage * 0.50");
        ensureSalaryRule(structAdmin, "Special Allowance", "ADMIN_SA", 10, "ALW", "PERCENTAGE", new BigDecimal("50.00"), null, "contract.wage * 0.50");
        ensureSalaryRule(structAdmin, "Gross Salary", "ADMIN_GROSS", 15, "GROSS", "FORMULA", null, null, "ADMIN_BASIC + ADMIN_SA");
        ensureSalaryRule(structAdmin, "Income Tax", "ADMIN_TAX", 20, "DED", "PERCENTAGE", new BigDecimal("10.00"), null, "GROSS * 0.10");
        ensureSalaryRule(structAdmin, "Net Salary", "ADMIN_NET", 100, "NET", "FORMULA", null, null, "ADMIN_GROSS - ADMIN_TAX");

        // Rules for Contractor (Hourly Wages)
        ensureSalaryRule(structContractor, "Hourly Wages", "HOURLY_BASE", 1, "BASIC", "FORMULA", null, null, "contract.wage * worked_hours");
        ensureSalaryRule(structContractor, "Overtime Allowance", "HOURLY_OT", 5, "ALW", "FORMULA", null, null, "contract.wage * 1.5 * overtime_hours");
        ensureSalaryRule(structContractor, "Gross Wages", "CONTRACT_GROSS", 10, "GROSS", "FORMULA", null, null, "HOURLY_BASE + HOURLY_OT");
        ensureSalaryRule(structContractor, "TDS Withholding", "CONTRACT_TDS", 20, "DED", "PERCENTAGE", new BigDecimal("10.00"), null, "GROSS * 0.10");
        ensureSalaryRule(structContractor, "Net Payout", "CONTRACT_NET", 100, "NET", "FORMULA", null, null, "CONTRACT_GROSS - CONTRACT_TDS");

        // 5. Employees (Mirrors 1-click Demo accounts with authentic Indian banking details)
        Employee empSarah = getOrCreateEmployee(
                "admin@company.com", "EMP-001", "Sarah", "Connor", "admin@company.com", "+91 98201 10101",
                LocalDate.of(1990, 5, 12), "Indiranagar, Bengaluru, Karnataka", deptEng, jobDev,
                LocalDate.of(2023, 1, 15), "50100234710293", "HDFC Bank", "HDFC0001234"
        );

        Employee empMichael = getOrCreateEmployee(
                "hrmanager@company.com", "EMP-002", "Michael", "Scott", "hrmanager@company.com", "+91 98202 10102",
                LocalDate.of(1982, 3, 15), "Bandra West, Mumbai, Maharashtra", deptHr, jobHrDir,
                LocalDate.of(2022, 6, 1), "30294819283741", "State Bank of India", "SBIN0005678"
        );

        Employee empDwight = getOrCreateEmployee(
                "employee@company.com", "EMP-003", "Dwight", "Schrute", "employee@company.com", "+91 98203 10103",
                LocalDate.of(1985, 1, 20), "Cyber City, Gurugram, Haryana", deptSales, jobSalesExec,
                LocalDate.of(2022, 9, 10), "00120159482716", "ICICI Bank", "ICIC0009101"
        );

        Employee empPam = getOrCreateEmployee(
                "pam@company.com", "EMP-004", "Pam", "Beesly", "pam@company.com", "+91 98204 10104",
                LocalDate.of(1988, 3, 25), "Koregaon Park, Pune, Maharashtra", deptMkt, jobMktLead,
                LocalDate.of(2023, 3, 1), "91201004019283", "Axis Bank", "UTIB0002345"
        );

        Employee empJim = getOrCreateEmployee(
                "jim@company.com", "EMP-005", "Jim", "Halpert", "jim@company.com", "+91 98205 10105",
                LocalDate.of(1987, 10, 1), "Banjara Hills, Hyderabad, Telangana", deptEng, jobOps,
                LocalDate.of(2023, 2, 15), "20100038472910", "Kotak Mahindra Bank", "KKBK0003456"
        );

        Employee empAlice = getOrCreateEmployee(
                "alice@example.com", "EMP-006", "Alice", "Smith", "alice@example.com", "+91 98206 10106",
                LocalDate.of(1994, 8, 18), "Whitefield, Bengaluru, Karnataka", deptEng, jobQa,
                LocalDate.of(2023, 5, 20), "50100839201948", "HDFC Bank", "HDFC0001234"
        );

        Employee empArthur = getOrCreateEmployee(
                "admin@odoo.com", "EMP-007", "Arthur", "Dent", "admin@odoo.com", "+91 98207 10107",
                LocalDate.of(1986, 4, 11), "Connaught Place, New Delhi", deptEng, jobDev,
                LocalDate.of(2022, 1, 10), "30194833491029", "State Bank of India", "SBIN0005678"
        );

        Employee empRachel = getOrCreateEmployee(
                "manager@odoo.com", "EMP-008", "Rachel", "Green", "manager@odoo.com", "+91 98208 10108",
                LocalDate.of(1991, 11, 24), "Jubilee Hills, Hyderabad, Telangana", deptHr, jobHrDir,
                LocalDate.of(2022, 8, 15), "00140244819203", "ICICI Bank", "ICIC0009101"
        );

        Employee empAarav = getOrCreateEmployee(
                "aarav@company.com", "EMP-009", "Aarav", "Mehta", "aarav@company.com", "+91 98209 10109",
                LocalDate.of(1992, 4, 10), "Marine Drive, Mumbai, Maharashtra", deptEng, jobDev,
                LocalDate.of(2023, 6, 1), "91201005592019", "Axis Bank", "UTIB0002345"
        );

        Employee empAisha = getOrCreateEmployee(
                "aisha@company.com", "EMP-010", "Aisha", "Khan", "aisha@company.com", "+91 98210 10110",
                LocalDate.of(1995, 7, 22), "Salt Lake Sector V, Kolkata, West Bengal", deptEng, jobQa,
                LocalDate.of(2023, 8, 1), "20100066920194", "Kotak Mahindra Bank", "KKBK0003456"
        );

        Employee empAnita = getOrCreateEmployee(
                "anita@company.com", "EMP-011", "Anita", "Patel", "anita@company.com", "+91 98211 10111",
                LocalDate.of(1993, 11, 14), "Navrangpura, Ahmedabad, Gujarat", deptFin, jobFinCtrl,
                LocalDate.of(2023, 9, 1), "50100779201948", "HDFC Bank", "HDFC0001234"
        );

        // Assign Department Managers
        deptEng.setManager(empSarah);
        deptHr.setManager(empMichael);
        deptSales.setManager(empDwight);
        deptMkt.setManager(empPam);
        deptFin.setManager(empSarah);
        departmentRepository.saveAll(List.of(deptEng, deptHr, deptSales, deptMkt, deptFin));

        // 6. Contracts with explicit Wage Type (Monthly Salaried vs Hourly Contractors)
        Contract cSarah = getOrCreateContract(empSarah, "MONTHLY", "PERMANENT", LocalDate.of(2023, 1, 15), new BigDecimal("65000.00"), structRegular, schedule40);
        Contract cMichael = getOrCreateContract(empMichael, "MONTHLY", "PERMANENT", LocalDate.of(2022, 6, 1), new BigDecimal("82000.00"), structAdmin, schedule40);
        Contract cDwight = getOrCreateContract(empDwight, "MONTHLY", "PERMANENT", LocalDate.of(2022, 9, 10), new BigDecimal("54000.00"), structRegular, schedule40);
        Contract cPam = getOrCreateContract(empPam, "MONTHLY", "PERMANENT", LocalDate.of(2023, 3, 1), new BigDecimal("48000.00"), structRegular, schedule40);
        Contract cJim = getOrCreateContract(empJim, "MONTHLY", "PERMANENT", LocalDate.of(2023, 2, 15), new BigDecimal("70000.00"), structRegular, schedule40);
        Contract cAlice = getOrCreateContract(empAlice, "MONTHLY", "PERMANENT", LocalDate.of(2023, 5, 20), new BigDecimal("52000.00"), structRegular, schedule40);
        Contract cArthur = getOrCreateContract(empArthur, "MONTHLY", "PERMANENT", LocalDate.of(2022, 1, 10), new BigDecimal("68000.00"), structRegular, schedule40);
        Contract cRachel = getOrCreateContract(empRachel, "MONTHLY", "PERMANENT", LocalDate.of(2022, 8, 15), new BigDecimal("75000.00"), structAdmin, schedule40);

        // Hourly contractor contracts
        Contract cAarav = getOrCreateContract(empAarav, "HOURLY", "HOURLY", LocalDate.of(2023, 6, 1), new BigDecimal("500.00"), structContractor, schedule40);
        Contract cAisha = getOrCreateContract(empAisha, "HOURLY", "HOURLY", LocalDate.of(2023, 8, 1), new BigDecimal("350.00"), structContractor, schedule40);
        Contract cAnita = getOrCreateContract(empAnita, "HOURLY", "PART_TIME", LocalDate.of(2023, 9, 1), new BigDecimal("250.00"), structContractor, schedulePartTime20);

        // Historical expired contract for Sarah Connor
        if (contractRepository.findByEmployeeId(empSarah.getId()).stream().noneMatch(c -> "EXPIRED".equalsIgnoreCase(c.getStatus()))) {
            contractRepository.save(Contract.builder()
                    .employee(empSarah)
                    .wageType("MONTHLY")
                    .contractType("PERMANENT")
                    .startDate(LocalDate.of(2022, 1, 15))
                    .endDate(LocalDate.of(2023, 1, 14))
                    .salary(new BigDecimal("50000.00"))
                    .salaryStructure(structRegular)
                    .workingSchedule(schedule40)
                    .status("EXPIRED")
                    .build());
        }

        // 7. Time Off Types & Allocations (Matches Wireframe 3)
        TimeOffType typePaid = getOrCreateTimeOffType("Paid Time Off", "Standard annual leave. Balance comes from approved allocations.", true, true, "Days", true, "Manager", "Leave Work Entry", "Blue", "Standard annual leave. Balance comes from approved allocations.");
        TimeOffType typeSick = getOrCreateTimeOffType("Sick Leave", "Medical leave for illness and health appointments", true, false, "Days", false, "Manager", "Leave Work Entry", "Orange", "Medical leave for illness and health appointments.");
        TimeOffType typeCompOff = getOrCreateTimeOffType("Comp Off", "Compensatory time off for overtime work", true, true, "Hours", true, "Officer", "Compensatory Work Entry", "Green", "Compensatory time off for overtime work.");

        List<Employee> allEmployees = List.of(empSarah, empMichael, empDwight, empPam, empJim, empAlice, empArthur, empRachel, empAarav, empAisha, empAnita);
        LocalDate yearStart = LocalDate.of(2026, 1, 1);
        LocalDate yearEnd = LocalDate.of(2026, 12, 31);

        // Specific wireframe allocations
        getOrCreateAllocation(empAarav, typePaid, yearStart, yearEnd, new BigDecimal("20.00"), new BigDecimal("8.00"), new BigDecimal("12.00"), "APPROVED", empSarah, "2026 Annual Balance", "Annual leave balance granted at start of policy year.");
        getOrCreateAllocation(empAisha, typePaid, yearStart, yearEnd, new BigDecimal("18.00"), new BigDecimal("4.00"), new BigDecimal("14.00"), "APPROVED", empSarah, "2026 Annual Balance", "Annual leave balance granted at start of policy year.");
        getOrCreateAllocation(empAnita, typeCompOff, yearStart, yearEnd, new BigDecimal("2.00"), new BigDecimal("1.00"), new BigDecimal("1.00"), "TO_APPROVE", null, "2026 Annual Balance", "Compensatory leave allocation.");

        for (Employee emp : allEmployees) {
            getOrCreateAllocation(emp, typePaid, yearStart, yearEnd, new BigDecimal("24.00"), new BigDecimal("2.00"), new BigDecimal("22.00"), "APPROVED", empSarah, "2026 Annual Balance", "Annual leave balance granted at start of policy year.");
            getOrCreateAllocation(emp, typeSick, yearStart, yearEnd, new BigDecimal("12.00"), BigDecimal.ZERO, new BigDecimal("12.00"), "APPROVED", empSarah, "2026 Annual Balance", "Standard sick leave allocation.");
        }

        // Leave Requests matching wireframe
        ensureLeaveRequest(empAarav, typePaid, LocalDate.of(2026, 9, 12), LocalDate.of(2026, 9, 14), new BigDecimal("2.00"), "Family vacation", "APPROVED", empSarah, "Paid Time Off 2026");
        ensureLeaveRequest(empAisha, typeSick, LocalDate.of(2026, 9, 10), LocalDate.of(2026, 9, 10), new BigDecimal("1.00"), "Medical checkup appointment", "APPROVED", empSarah, "Sick Leave 2026");
        ensureLeaveRequest(empDwight, typeCompOff, LocalDate.of(2026, 9, 28), LocalDate.of(2026, 9, 28), new BigDecimal("1.00"), "Weekend deployment overtime compensatory day", "PENDING", null, "Comp Off 2026");
        ensureLeaveRequest(empPam, typePaid, LocalDate.now().plusDays(10), LocalDate.now().plusDays(12), new BigDecimal("3.00"), "Family vacation trip", "APPROVED", empMichael, "Paid Time Off 2026");
        ensureLeaveRequest(empJim, typePaid, LocalDate.now().plusDays(5), LocalDate.now().plusDays(7), new BigDecimal("3.00"), "Personal retreat", "APPROVED", empSarah, "Paid Time Off 2026");
        ensureLeaveRequest(empAlice, typePaid, LocalDate.now().plusDays(14), LocalDate.now().plusDays(18), new BigDecimal("5.00"), "Annual holiday leave", "PENDING", null, "Paid Time Off 2026");

        // 8. Attendance Logs: February 2026 weekdays (20 business days) showcasing LOP and Overtime
        List<LocalDate> febWorkDays = List.of(
            LocalDate.of(2026, 2, 2), LocalDate.of(2026, 2, 3), LocalDate.of(2026, 2, 4), LocalDate.of(2026, 2, 5), LocalDate.of(2026, 2, 6),
            LocalDate.of(2026, 2, 9), LocalDate.of(2026, 2, 10), LocalDate.of(2026, 2, 11), LocalDate.of(2026, 2, 12), LocalDate.of(2026, 2, 13),
            LocalDate.of(2026, 2, 16), LocalDate.of(2026, 2, 17), LocalDate.of(2026, 2, 18), LocalDate.of(2026, 2, 19), LocalDate.of(2026, 2, 20),
            LocalDate.of(2026, 2, 23), LocalDate.of(2026, 2, 24), LocalDate.of(2026, 2, 25), LocalDate.of(2026, 2, 26), LocalDate.of(2026, 2, 27)
        );

        for (LocalDate date : febWorkDays) {
            int dayIdx = febWorkDays.indexOf(date);
            OffsetDateTime stdIn = OffsetDateTime.of(date.getYear(), date.getMonthValue(), date.getDayOfMonth(), 9, 0, 0, 0, ZoneOffset.ofHoursMinutes(5, 30));
            OffsetDateTime stdOut = OffsetDateTime.of(date.getYear(), date.getMonthValue(), date.getDayOfMonth(), 18, 0, 0, 0, ZoneOffset.ofHoursMinutes(5, 30));

            // Sarah, Michael, Pam, Alice, Arthur, Rachel: Standard 8h/day
            for (Employee emp : List.of(empSarah, empMichael, empPam, empAlice, empArthur, empRachel)) {
                ensureAttendance(emp, date, stdIn, stdOut, new BigDecimal("8.00"), BigDecimal.ZERO, "PRESENT", "Regular daily shift completed");
            }

            // Dwight Schrute: 18 days present, 2 days ABSENT (Feb 16 & Feb 17 -> LOP deduction)
            if (date.equals(LocalDate.of(2026, 2, 16)) || date.equals(LocalDate.of(2026, 2, 17))) {
                ensureAttendance(empDwight, date, null, null, BigDecimal.ZERO, BigDecimal.ZERO, "ABSENT", "Unplanned absence - LOP deduction applied");
            } else {
                ensureAttendance(empDwight, date, stdIn, stdOut, new BigDecimal("8.00"), BigDecimal.ZERO, "PRESENT", "Regular daily shift completed");
            }

            // Jim Halpert: Overtime logged on 5 days (2.5h each = 12.5 hrs total OT)
            if (dayIdx == 2 || dayIdx == 4 || dayIdx == 7 || dayIdx == 12 || dayIdx == 17) {
                OffsetDateTime otOut = OffsetDateTime.of(date.getYear(), date.getMonthValue(), date.getDayOfMonth(), 20, 30, 0, 0, ZoneOffset.ofHoursMinutes(5, 30));
                ensureAttendance(empJim, date, stdIn, otOut, new BigDecimal("10.50"), new BigDecimal("2.50"), "PRESENT", "Shift with 2.5 hrs overtime");
            } else {
                ensureAttendance(empJim, date, stdIn, stdOut, new BigDecimal("8.00"), BigDecimal.ZERO, "PRESENT", "Regular daily shift completed");
            }

            // Aarav Mehta (Hourly ₹500/hr): 18 days worked (144 hrs) + 8 hrs OT = 152 hrs. 2 days ON_LEAVE.
            if (date.equals(LocalDate.of(2026, 2, 12)) || date.equals(LocalDate.of(2026, 2, 20))) {
                ensureAttendance(empAarav, date, null, null, BigDecimal.ZERO, BigDecimal.ZERO, "ON_LEAVE", "Approved paid leave");
            } else {
                boolean hasOt = (dayIdx % 2 == 0 && dayIdx < 16);
                BigDecimal ot = hasOt ? new BigDecimal("1.00") : BigDecimal.ZERO;
                BigDecimal worked = hasOt ? new BigDecimal("9.00") : new BigDecimal("8.00");
                OffsetDateTime outT = hasOt
                        ? OffsetDateTime.of(date.getYear(), date.getMonthValue(), date.getDayOfMonth(), 19, 0, 0, 0, ZoneOffset.ofHoursMinutes(5, 30))
                        : stdOut;
                ensureAttendance(empAarav, date, stdIn, outT, worked, ot, "PRESENT", hasOt ? "Hourly shift with 1 hr overtime" : "Regular hourly shift completed");
            }

            // Aisha Khan (Hourly ₹350/hr): 15 days worked (120 hrs) + 5 hrs OT = 125 hrs. 5 days ON_LEAVE.
            if (dayIdx >= 15) {
                ensureAttendance(empAisha, date, null, null, BigDecimal.ZERO, BigDecimal.ZERO, "ON_LEAVE", "Approved personal time off");
            } else {
                boolean hasOt = (dayIdx < 5);
                BigDecimal ot = hasOt ? new BigDecimal("1.00") : BigDecimal.ZERO;
                BigDecimal worked = hasOt ? new BigDecimal("9.00") : new BigDecimal("8.00");
                OffsetDateTime outT = hasOt
                        ? OffsetDateTime.of(date.getYear(), date.getMonthValue(), date.getDayOfMonth(), 19, 0, 0, 0, ZoneOffset.ofHoursMinutes(5, 30))
                        : stdOut;
                ensureAttendance(empAisha, date, stdIn, outT, worked, ot, "PRESENT", hasOt ? "Hourly shift with 1 hr overtime" : "Regular hourly shift completed");
            }

            // Anita Patel (Hourly ₹250/hr, Part-time 4h): 18 days worked (72 hrs). 2 days ON_LEAVE.
            if (dayIdx == 0 || dayIdx == 10) {
                ensureAttendance(empAnita, date, null, null, BigDecimal.ZERO, BigDecimal.ZERO, "ON_LEAVE", "Approved leave");
            } else {
                OffsetDateTime ptOut = OffsetDateTime.of(date.getYear(), date.getMonthValue(), date.getDayOfMonth(), 13, 0, 0, 0, ZoneOffset.ofHoursMinutes(5, 30));
                ensureAttendance(empAnita, date, stdIn, ptOut, new BigDecimal("4.00"), BigDecimal.ZERO, "PRESENT", "Part-time 4-hour morning shift");
            }
        }

        // Additional sample attendance dates across Sep & Jan for historical queries
        Set<LocalDate> demoAttendanceDates = new LinkedHashSet<>(List.of(
            LocalDate.now(),
            LocalDate.now().minusDays(1),
            LocalDate.of(2026, 9, 1),
            LocalDate.of(2026, 9, 2),
            LocalDate.of(2026, 9, 3),
            LocalDate.of(2026, 9, 4),
            LocalDate.of(2026, 1, 12),
            LocalDate.of(2026, 1, 15),
            LocalDate.of(2026, 1, 16),
            LocalDate.of(2026, 1, 22)
        ));

        for (Employee emp : allEmployees) {
            for (LocalDate date : demoAttendanceDates) {
                int hash = Math.abs((emp.getEmployeeCode().hashCode() * 37 + date.hashCode()) % 100);
                String status = "PRESENT";
                OffsetDateTime inTime = OffsetDateTime.of(date.getYear(), date.getMonthValue(), date.getDayOfMonth(), 9, (hash % 15), 0, 0, ZoneOffset.ofHoursMinutes(5, 30));
                OffsetDateTime outTime = OffsetDateTime.of(date.getYear(), date.getMonthValue(), date.getDayOfMonth(), 18, (hash % 30), 0, 0, ZoneOffset.ofHoursMinutes(5, 30));
                BigDecimal worked = new BigDecimal("8.75");
                BigDecimal ot = new BigDecimal("0.75");
                String notes = "Regular daily shift completed";

                if (hash > 93) {
                    status = "ON_LEAVE";
                    inTime = null;
                    outTime = null;
                    worked = BigDecimal.ZERO;
                    ot = BigDecimal.ZERO;
                    notes = "Approved leave";
                } else if (hash > 88) {
                    status = "ABSENT";
                    inTime = null;
                    outTime = null;
                    worked = BigDecimal.ZERO;
                    ot = BigDecimal.ZERO;
                    notes = "Unplanned absence";
                }

                ensureAttendance(emp, date, inTime, outTime, worked, ot, status, notes);
            }
        }

        // 9. Scoped Payruns & Payslips for February 2026
        Payrun payrunFebRegular = getOrCreatePayrun(LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28), structRegular, "DRAFT", "admin@company.com");
        Payrun payrunFebAdmin = getOrCreatePayrun(LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28), structAdmin, "CONFIRMED", "admin@company.com");
        Payrun payrunFebContractor = getOrCreatePayrun(LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28), structContractor, "DRAFT", "admin@company.com");

        // Seed Payslips in February 2026 Regular Staff Payrun
        // Sarah Connor (EMP-001): ₹65,000/mo
        seedSalariedPayslip(payrunFebRegular, empSarah, cSarah, structRegular,
                new BigDecimal("50500.00"), new BigDecimal("4100.00"), new BigDecimal("46400.00"), "DRAFT",
                new BigDecimal("32500.00"), new BigDecimal("13000.00"), new BigDecimal("5000.00"), BigDecimal.ZERO, BigDecimal.ZERO,
                new BigDecimal("3900.00"), new BigDecimal("200.00"));

        // Dwight Schrute (EMP-003): ₹54,000/mo with 2 Days Unpaid Absence -> LOP = ₹5,400.00
        seedSalariedPayslip(payrunFebRegular, empDwight, cDwight, structRegular,
                new BigDecimal("42800.00"), new BigDecimal("8840.00"), new BigDecimal("33960.00"), "DRAFT",
                new BigDecimal("27000.00"), new BigDecimal("10800.00"), new BigDecimal("5000.00"), BigDecimal.ZERO, new BigDecimal("5400.00"),
                new BigDecimal("3240.00"), new BigDecimal("200.00"));

        // Jim Halpert (EMP-005): ₹70,000/mo with 12.5 hrs Overtime -> Overtime Allowance = ₹8,203.13
        seedSalariedPayslip(payrunFebRegular, empJim, cJim, structRegular,
                new BigDecimal("62203.13"), new BigDecimal("4400.00"), new BigDecimal("57803.13"), "DRAFT",
                new BigDecimal("35000.00"), new BigDecimal("14000.00"), new BigDecimal("5000.00"), new BigDecimal("8203.13"), BigDecimal.ZERO,
                new BigDecimal("4200.00"), new BigDecimal("200.00"));

        // Pam Beesly (EMP-004): ₹48,000/mo
        seedSalariedPayslip(payrunFebRegular, empPam, cPam, structRegular,
                new BigDecimal("38600.00"), new BigDecimal("3080.00"), new BigDecimal("35520.00"), "DRAFT",
                new BigDecimal("24000.00"), new BigDecimal("9600.00"), new BigDecimal("5000.00"), BigDecimal.ZERO, BigDecimal.ZERO,
                new BigDecimal("2880.00"), new BigDecimal("200.00"));

        // Alice Smith (EMP-006): ₹52,000/mo
        seedSalariedPayslip(payrunFebRegular, empAlice, cAlice, structRegular,
                new BigDecimal("41400.00"), new BigDecimal("3320.00"), new BigDecimal("38080.00"), "DRAFT",
                new BigDecimal("26000.00"), new BigDecimal("10400.00"), new BigDecimal("5000.00"), BigDecimal.ZERO, BigDecimal.ZERO,
                new BigDecimal("3120.00"), new BigDecimal("200.00"));

        // Arthur Dent (EMP-007): ₹68,000/mo
        seedSalariedPayslip(payrunFebRegular, empArthur, cArthur, structRegular,
                new BigDecimal("52600.00"), new BigDecimal("4280.00"), new BigDecimal("48320.00"), "DRAFT",
                new BigDecimal("34000.00"), new BigDecimal("13600.00"), new BigDecimal("5000.00"), BigDecimal.ZERO, BigDecimal.ZERO,
                new BigDecimal("4080.00"), new BigDecimal("200.00"));

        // Seed Payslips in February 2026 Admin Staff Payrun
        // Michael Scott (EMP-002): ₹82,000/mo
        seedAdminPayslip(payrunFebAdmin, empMichael, cMichael, structAdmin,
                new BigDecimal("82000.00"), new BigDecimal("8200.00"), new BigDecimal("73800.00"), "CONFIRMED",
                new BigDecimal("41000.00"), new BigDecimal("41000.00"), new BigDecimal("8200.00"));

        // Rachel Green (EMP-008): ₹75,000/mo
        seedAdminPayslip(payrunFebAdmin, empRachel, cRachel, structAdmin,
                new BigDecimal("75000.00"), new BigDecimal("7500.00"), new BigDecimal("67500.00"), "CONFIRMED",
                new BigDecimal("37500.00"), new BigDecimal("37500.00"), new BigDecimal("7500.00"));

        // Seed Payslips in February 2026 Contractor & Hourly Payrun
        // Aarav Mehta (EMP-009): 144 hrs @ ₹500.00/hr + 8 hrs OT @ 1.5x
        seedHourlyPayslip(payrunFebContractor, empAarav, cAarav, structContractor,
                new BigDecimal("78000.00"), new BigDecimal("7800.00"), new BigDecimal("70200.00"), "DRAFT",
                new BigDecimal("72000.00"), new BigDecimal("6000.00"), new BigDecimal("7800.00"),
                144.0, 500.0, 8.0);

        // Aisha Khan (EMP-010): 120 hrs @ ₹350.00/hr + 5 hrs OT @ 1.5x
        seedHourlyPayslip(payrunFebContractor, empAisha, cAisha, structContractor,
                new BigDecimal("44625.00"), new BigDecimal("4462.50"), new BigDecimal("40162.50"), "DRAFT",
                new BigDecimal("42000.00"), new BigDecimal("2625.00"), new BigDecimal("4462.50"),
                120.0, 350.0, 5.0);

        // Anita Patel (EMP-011): 72 hrs @ ₹250.00/hr (Part-time)
        seedHourlyPayslip(payrunFebContractor, empAnita, cAnita, structContractor,
                new BigDecimal("18000.00"), new BigDecimal("1800.00"), new BigDecimal("16200.00"), "DRAFT",
                new BigDecimal("18000.00"), BigDecimal.ZERO, new BigDecimal("1800.00"),
                72.0, 250.0, 0.0);

        // Historical Payruns: January 2026 (PAID) & September 2026 (PAID)
        Payrun payrunJan = getOrCreatePayrun(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31), structRegular, "PAID", "admin@company.com");
        seedSalariedPayslip(payrunJan, empSarah, cSarah, structRegular, new BigDecimal("50500.00"), new BigDecimal("4100.00"), new BigDecimal("46400.00"), "PAID", new BigDecimal("32500.00"), new BigDecimal("13000.00"), new BigDecimal("5000.00"), BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("3900.00"), new BigDecimal("200.00"));
        seedSalariedPayslip(payrunJan, empDwight, cDwight, structRegular, new BigDecimal("42800.00"), new BigDecimal("3440.00"), new BigDecimal("39360.00"), "PAID", new BigDecimal("27000.00"), new BigDecimal("10800.00"), new BigDecimal("5000.00"), BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("3240.00"), new BigDecimal("200.00"));
        seedSalariedPayslip(payrunJan, empPam, cPam, structRegular, new BigDecimal("38600.00"), new BigDecimal("3080.00"), new BigDecimal("35520.00"), "PAID", new BigDecimal("24000.00"), new BigDecimal("9600.00"), new BigDecimal("5000.00"), BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("2880.00"), new BigDecimal("200.00"));
        seedSalariedPayslip(payrunJan, empJim, cJim, structRegular, new BigDecimal("54000.00"), new BigDecimal("4400.00"), new BigDecimal("49600.00"), "PAID", new BigDecimal("35000.00"), new BigDecimal("14000.00"), new BigDecimal("5000.00"), BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("4200.00"), new BigDecimal("200.00"));

        Payrun payrunSep = getOrCreatePayrun(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), structRegular, "PAID", "admin@company.com");
        seedSalariedPayslip(payrunSep, empSarah, cSarah, structRegular, new BigDecimal("50500.00"), new BigDecimal("4100.00"), new BigDecimal("46400.00"), "PAID", new BigDecimal("32500.00"), new BigDecimal("13000.00"), new BigDecimal("5000.00"), BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("3900.00"), new BigDecimal("200.00"));
        seedSalariedPayslip(payrunSep, empDwight, cDwight, structRegular, new BigDecimal("42800.00"), new BigDecimal("3440.00"), new BigDecimal("39360.00"), "PAID", new BigDecimal("27000.00"), new BigDecimal("10800.00"), new BigDecimal("5000.00"), BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("3240.00"), new BigDecimal("200.00"));
        seedSalariedPayslip(payrunSep, empJim, cJim, structRegular, new BigDecimal("54000.00"), new BigDecimal("4400.00"), new BigDecimal("49600.00"), "PAID", new BigDecimal("35000.00"), new BigDecimal("14000.00"), new BigDecimal("5000.00"), BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("4200.00"), new BigDecimal("200.00"));

        // If EMP-1001 exists, reseed contracts and attendance for 250 Indian employees
        try {
            indianUsersDataSeeder.resetAndSeedIndianUsersContractsAndAttendance(structRegular, structAdmin, structContractor, schedule40);
        } catch (Exception e) {
            log.warn("Could not re-seed Indian users contracts/attendance: {}", e.getMessage());
        }

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

    private WorkingSchedule getOrCreateWorkingSchedule(
            String name, String description, String company, String calType, String tz, String status,
            List<WorkingScheduleDayConfig> dayConfigs) {
        return workingScheduleRepository.findAll().stream()
                .filter(s -> s.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> {
                    WorkingSchedule ws = workingScheduleRepository.save(WorkingSchedule.builder()
                            .name(name)
                            .description(description)
                            .company(company != null ? company : "My Company")
                            .calendarType(calType != null ? calType : "STANDARD")
                            .timezone(tz != null ? tz : "Company Default")
                            .status(status != null ? status : "ACTIVE")
                            .build());
                    for (WorkingScheduleDayConfig cfg : dayConfigs) {
                        WorkingScheduleDay d = WorkingScheduleDay.builder()
                                .workingSchedule(ws)
                                .weekday(cfg.weekday)
                                .startTime(cfg.startTime)
                                .endTime(cfg.endTime)
                                .breakMinutes(cfg.breakMinutes)
                                .build();
                        ws.getDays().add(d);
                    }
                    return workingScheduleRepository.save(ws);
                });
    }

    private static class WorkingScheduleDayConfig {
        String weekday;
        LocalTime startTime;
        LocalTime endTime;
        int breakMinutes;

        WorkingScheduleDayConfig(String weekday, LocalTime startTime, LocalTime endTime, int breakMinutes) {
            this.weekday = weekday;
            this.startTime = startTime;
            this.endTime = endTime;
            this.breakMinutes = breakMinutes;
        }
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

    private void ensureSalaryRule(SalaryStructure structure, String name, String code, int seq, String cat, String calcType, BigDecimal pct, BigDecimal val, String formula) {
        Optional<SalaryRule> existing = salaryRuleRepository.findFirstByCode(code);
        if (existing.isEmpty()) {
            salaryRuleRepository.save(SalaryRule.builder()
                    .salaryStructure(structure)
                    .name(name)
                    .code(code)
                    .sequence(seq)
                    .category(cat)
                    .calculationType(calcType)
                    .percentage(pct)
                    .value(val)
                    .formula(formula)
                    .active(true)
                    .build());
        } else {
            SalaryRule rule = existing.get();
            rule.setSalaryStructure(structure);
            rule.setName(name);
            rule.setSequence(seq);
            rule.setCategory(cat);
            rule.setCalculationType(calcType);
            rule.setPercentage(pct);
            rule.setValue(val);
            rule.setFormula(formula);
            rule.setActive(true);
            salaryRuleRepository.save(rule);
        }
    }

    private Employee getOrCreateEmployee(String authId, String code, String first, String last, String email, String phone,
                                        LocalDate dob, String address, Department dept, JobPosition job, LocalDate join,
                                        String bankAcc, String bankName, String ifsc) {
        WorkingSchedule defaultSchedule = workingScheduleRepository.findByName("40 Hours / Week").orElse(null);
        return employeeRepository.findByEmail(email).map(emp -> {
            if (emp.getWorkingSchedule() == null && defaultSchedule != null) {
                emp.setWorkingSchedule(defaultSchedule);
                employeeRepository.save(emp);
            }
            return emp;
        }).orElseGet(() ->
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
                        .workingSchedule(defaultSchedule)
                        .joiningDate(join)
                        .employeeType("FULL_TIME")
                        .status("ACTIVE")
                        .bankAccountNo(bankAcc)
                        .bankName(bankName)
                        .ifscCode(ifsc)
                        .emergencyContactName(last + " Family")
                        .emergencyContactPhone(phone)
                        .build())
        );
    }

    private Contract getOrCreateContract(Employee emp, String wageType, String type, LocalDate start, BigDecimal salary, SalaryStructure struct, WorkingSchedule schedule) {
        return contractRepository.findByEmployeeId(emp.getId()).stream()
                .filter(c -> "RUNNING".equalsIgnoreCase(c.getStatus()) || "ACTIVE".equalsIgnoreCase(c.getStatus()))
                .findFirst()
                .map(c -> {
                    c.setWageType(wageType != null ? wageType : ("HOURLY".equalsIgnoreCase(type) ? "HOURLY" : "MONTHLY"));
                    c.setContractType(type);
                    c.setSalary(salary);
                    c.setSalaryStructure(struct);
                    if (schedule != null) {
                        c.setWorkingSchedule(schedule);
                    }
                    return contractRepository.save(c);
                })
                .orElseGet(() ->
                        contractRepository.save(Contract.builder()
                                .employee(emp)
                                .wageType(wageType != null ? wageType : ("HOURLY".equalsIgnoreCase(type) ? "HOURLY" : "MONTHLY"))
                                .contractType(type)
                                .startDate(start)
                                .salary(salary)
                                .salaryStructure(struct)
                                .workingSchedule(schedule)
                                .status("RUNNING")
                                .build())
                );
    }

    private TimeOffType getOrCreateTimeOffType(String name, String desc, boolean paid, boolean reqApproval, String unit, boolean reqAlloc, String approvalType, String payrollWorkEntry, String color, String notes) {
        return timeOffTypeRepository.findByName(name).map(t -> {
            t.setUnit(unit);
            t.setRequiresAllocation(reqAlloc);
            t.setApprovalType(approvalType);
            t.setPayrollWorkEntry(payrollWorkEntry);
            t.setDisplayColor(color);
            t.setConfigurationNotes(notes);
            return timeOffTypeRepository.save(t);
        }).orElseGet(() ->
                timeOffTypeRepository.save(TimeOffType.builder()
                        .name(name)
                        .description(desc)
                        .paid(paid)
                        .requiresApproval(reqApproval)
                        .unit(unit)
                        .requiresAllocation(reqAlloc)
                        .approvalType(approvalType)
                        .payrollWorkEntry(payrollWorkEntry)
                        .displayColor(color)
                        .configurationNotes(notes)
                        .status("ACTIVE")
                        .build())
        );
    }

    private void getOrCreateAllocation(Employee emp, TimeOffType type, LocalDate start, LocalDate end, BigDecimal alloc, BigDecimal used, BigDecimal rem, String status, Employee approver, String validity, String desc) {
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
                    .status(status != null ? status : "APPROVED")
                    .approvedBy(approver)
                    .validity(validity != null ? validity : "2026 Annual Balance")
                    .description(desc != null ? desc : "Annual leave balance granted at start of policy year.")
                    .build());
        }
    }

    private void ensureLeaveRequest(Employee emp, TimeOffType type, LocalDate start, LocalDate end, BigDecimal duration, String reason, String status, Employee approver, String allocUsed) {
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
                    .allocationUsedName(allocUsed != null ? allocUsed : (type.getName() + " 2026"))
                    .build());
        }
    }

    private void ensureAttendance(Employee emp, LocalDate date, OffsetDateTime in, OffsetDateTime out, BigDecimal worked, BigDecimal ot, String status, String notes) {
        Optional<Attendance> existing = attendanceRepository.findByEmployeeIdAndAttendanceDate(emp.getId(), date);
        if (existing.isEmpty()) {
            attendanceRepository.save(Attendance.builder()
                    .employee(emp)
                    .attendanceDate(date)
                    .checkIn(in != null ? in : OffsetDateTime.now().withHour(9).withMinute(0).withSecond(0))
                    .checkOut(out)
                    .workedHours(worked)
                    .scheduledHours(new BigDecimal("8.00"))
                    .overtimeHours(ot != null ? ot : BigDecimal.ZERO)
                    .lateMinutes(0)
                    .status(status)
                    .notes(notes)
                    .build());
        }
    }

    private Payrun getOrCreatePayrun(LocalDate start, LocalDate end, SalaryStructure struct, String status, String createdBy) {
        return payrunRepository.findAll().stream()
                .filter(p -> p.getPeriodStart().equals(start) && p.getPeriodEnd().equals(end)
                        && (struct == null || (p.getSalaryStructure() != null && p.getSalaryStructure().getId().equals(struct.getId()))))
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

    private Payslip getOrCreatePayslip(Payrun payrun, Employee emp, Contract contract, SalaryStructure struct,
                                       BigDecimal gross, BigDecimal ded, BigDecimal net, String status) {
        Optional<Payslip> existingOpt = payslipRepository.findByEmployeeIdAndPeriodStartAndPeriodEnd(
                emp.getId(), payrun.getPeriodStart(), payrun.getPeriodEnd());
        Payslip ps;
        if (existingOpt.isPresent()) {
            ps = existingOpt.get();
            ps.setPayrun(payrun);
            ps.setContract(contract);
            ps.setSalaryStructure(struct);
            ps.setGrossSalary(gross);
            ps.setTotalDeductions(ded);
            ps.setNetSalary(net);
            ps.setStatus(status != null ? status : "DRAFT");
            ps = payslipRepository.saveAndFlush(ps);
            List<PayslipLine> oldLines = payslipLineRepository.findByPayslipIdOrderBySequenceAsc(ps.getId());
            if (oldLines != null && !oldLines.isEmpty()) {
                payslipLineRepository.deleteAllInBatch(oldLines);
            }
        } else {
            ps = payslipRepository.saveAndFlush(Payslip.builder()
                    .payrun(payrun)
                    .employee(emp)
                    .contract(contract)
                    .salaryStructure(struct)
                    .periodStart(payrun.getPeriodStart())
                    .periodEnd(payrun.getPeriodEnd())
                    .grossSalary(gross)
                    .totalDeductions(ded)
                    .netSalary(net)
                    .status(status != null ? status : "DRAFT")
                    .lines(new ArrayList<>())
                    .build());
        }

        // Link employee's attendance records in this period to this payslip
        List<Attendance> atts = attendanceRepository.findByEmployeeIdAndAttendanceDateBetweenOrderByAttendanceDateDesc(
                emp.getId(), payrun.getPeriodStart(), payrun.getPeriodEnd());
        if (atts != null && !atts.isEmpty()) {
            boolean isPaid = "PAID".equalsIgnoreCase(ps.getStatus()) || "PAID".equalsIgnoreCase(payrun.getStatus());
            OffsetDateTime paidTime = payrun.getPaidAt() != null ? payrun.getPaidAt() : OffsetDateTime.now().minusDays(1);
            for (Attendance a : atts) {
                a.setPayslip(ps);
                if (isPaid) {
                    a.setIsPaid(true);
                    a.setPaidAt(paidTime);
                } else {
                    a.setIsPaid(false);
                    a.setPaidAt(null);
                }
            }
            attendanceRepository.saveAll(atts);
        }

        return ps;
    }

    private void seedSalariedPayslip(Payrun payrun, Employee emp, Contract contract, SalaryStructure struct,
                                    BigDecimal gross, BigDecimal ded, BigDecimal net, String status,
                                    BigDecimal basic, BigDecimal hra, BigDecimal std, BigDecimal overtime, BigDecimal lop,
                                    BigDecimal pf, BigDecimal pt) {
        Payslip ps = getOrCreatePayslip(payrun, emp, contract, struct, gross, ded, net, status);

        int seq = 1;
        payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("BASIC").ruleName("Basic Salary").category("BASIC").amount(basic).sequence(seq++).build());
        payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("HRA").ruleName("House Rent Allowance").category("ALW").amount(hra).sequence(seq++).build());
        payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("STD").ruleName("Standard Allowance").category("ALW").amount(std).sequence(seq++).build());
        if (overtime != null && overtime.compareTo(BigDecimal.ZERO) > 0) {
            payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("OVERTIME").ruleName("Overtime Allowance").category("ALW").amount(overtime).sequence(seq++).build());
        }
        payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("GROSS").ruleName("Gross Salary").category("GROSS").amount(gross).sequence(seq++).build());
        if (lop != null && lop.compareTo(BigDecimal.ZERO) > 0) {
            payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("LOP").ruleName("Loss of Pay (Absent Days)").category("DED").amount(lop).sequence(seq++).build());
        }
        payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("PF").ruleName("Provident Fund").category("DED").amount(pf).sequence(seq++).build());
        payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("PT").ruleName("Professional Tax").category("DED").amount(pt).sequence(seq++).build());
        payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("NET").ruleName("Net Salary").category("NET").amount(net).sequence(100).build());
    }

    private void seedAdminPayslip(Payrun payrun, Employee emp, Contract contract, SalaryStructure struct,
                                 BigDecimal gross, BigDecimal ded, BigDecimal net, String status,
                                 BigDecimal basic, BigDecimal specialAllowance, BigDecimal tax) {
        Payslip ps = getOrCreatePayslip(payrun, emp, contract, struct, gross, ded, net, status);

        int seq = 1;
        payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("ADMIN_BASIC").ruleName("Basic Salary").category("BASIC").amount(basic).sequence(seq++).build());
        payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("ADMIN_SA").ruleName("Special Allowance").category("ALW").amount(specialAllowance).sequence(seq++).build());
        payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("GROSS").ruleName("Gross Salary").category("GROSS").amount(gross).sequence(seq++).build());
        payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("ADMIN_TAX").ruleName("Income Tax (TDS)").category("DED").amount(tax).sequence(seq++).build());
        payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("NET").ruleName("Net Salary").category("NET").amount(net).sequence(100).build());
    }

    private void seedHourlyPayslip(Payrun payrun, Employee emp, Contract contract, SalaryStructure struct,
                                  BigDecimal gross, BigDecimal ded, BigDecimal net, String status,
                                  BigDecimal baseAmount, BigDecimal overtimeAmount, BigDecimal tds,
                                  double workedHours, double hourlyRate, double otHours) {
        Payslip ps = getOrCreatePayslip(payrun, emp, contract, struct, gross, ded, net, status);

        int seq = 1;
        String baseLabel = String.format("Hourly Wages (%.1f hrs @ ₹%.2f/hr)", workedHours, hourlyRate);
        payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("HOURLY_BASE").ruleName(baseLabel).category("BASIC").amount(baseAmount).sequence(seq++).build());
        if (overtimeAmount != null && overtimeAmount.compareTo(BigDecimal.ZERO) > 0) {
            String otLabel = String.format("Overtime Allowance (%.1f hrs @ 1.5x)", otHours);
            payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("OVERTIME").ruleName(otLabel).category("ALW").amount(overtimeAmount).sequence(seq++).build());
        }
        payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("GROSS").ruleName("Gross Wages").category("GROSS").amount(gross).sequence(seq++).build());
        payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("CONTRACT_TDS").ruleName("TDS Withholding (10%)").category("DED").amount(tds).sequence(seq++).build());
        payslipLineRepository.save(PayslipLine.builder().payslip(ps).ruleCode("NET").ruleName("Net Payout").category("NET").amount(net).sequence(100).build());
    }
}
