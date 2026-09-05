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
import java.util.List;

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
    @Transactional
    public void run(String... args) {
        if (departmentRepository.count() > 0) {
            log.info("Database already contains data; skipping seed initialization.");
            return;
        }

        log.info("Seeding realistic enterprise HRMS data into PostgreSQL hr_db...");

        // 1. Departments
        Department deptEng = departmentRepository.save(Department.builder()
                .name("Engineering")
                .description("Software architecture, web applications, and backend infrastructure")
                .status("ACTIVE")
                .build());

        Department deptHr = departmentRepository.save(Department.builder()
                .name("Human Resources")
                .description("Talent acquisition, payroll management, and people operations")
                .status("ACTIVE")
                .build());

        Department deptSales = departmentRepository.save(Department.builder()
                .name("Sales")
                .description("Global revenue, enterprise sales, and customer relations")
                .status("ACTIVE")
                .build());

        Department deptMkt = departmentRepository.save(Department.builder()
                .name("Marketing")
                .description("Brand positioning, performance marketing, and digital outreach")
                .status("ACTIVE")
                .build());

        Department deptFin = departmentRepository.save(Department.builder()
                .name("Finance")
                .description("Corporate accounting, budgeting, and statutory compliance")
                .status("ACTIVE")
                .build());

        // 2. Job Positions
        JobPosition jobDev = jobPositionRepository.save(JobPosition.builder()
                .title("Senior Fullstack Engineer")
                .department(deptEng)
                .description("Builds scalable React webapps and Spring Boot microservices")
                .status("ACTIVE")
                .build());

        JobPosition jobOps = jobPositionRepository.save(JobPosition.builder()
                .title("DevOps & Cloud Architect")
                .department(deptEng)
                .description("Manages CI/CD pipelines, Docker, Kubernetes and PostgreSQL clusters")
                .status("ACTIVE")
                .build());

        JobPosition jobHrDir = jobPositionRepository.save(JobPosition.builder()
                .title("HR Director")
                .department(deptHr)
                .description("Leads company-wide human resource strategy and employee satisfaction")
                .status("ACTIVE")
                .build());

        JobPosition jobSalesExec = jobPositionRepository.save(JobPosition.builder()
                .title("Senior Account Executive")
                .department(deptSales)
                .description("Drives B2B enterprise software contracts and customer acquisition")
                .status("ACTIVE")
                .build());

        JobPosition jobMktLead = jobPositionRepository.save(JobPosition.builder()
                .title("Marketing Lead")
                .department(deptMkt)
                .description("Orchestrates brand campaigns, social media, and product launches")
                .status("ACTIVE")
                .build());

        JobPosition jobFinCtrl = jobPositionRepository.save(JobPosition.builder()
                .title("Financial Controller")
                .department(deptFin)
                .description("Supervises financial reporting, accounts ledger, and payroll disbursements")
                .status("ACTIVE")
                .build());

        // 3. Working Schedule
        WorkingSchedule schedule40 = WorkingSchedule.builder()
                .name("Standard 40h (Mon-Fri 09:00-18:00)")
                .description("Standard full-time schedule with 1 hour lunch break")
                .build();
        schedule40 = workingScheduleRepository.save(schedule40);

        String[] weekdays = {"MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"};
        for (String day : weekdays) {
            WorkingScheduleDay scheduleDay = WorkingScheduleDay.builder()
                    .workingSchedule(schedule40)
                    .weekday(day)
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(18, 0))
                    .breakMinutes(60)
                    .build();
            schedule40.getDays().add(scheduleDay);
        }
        workingScheduleRepository.save(schedule40);

        // 4. Salary Structures & Rules
        SalaryStructure structRegular = salaryStructureRepository.save(SalaryStructure.builder()
                .name("Regular Full-Time")
                .description("Standard full-time salary package with basic, HRA, allowances, and tax deductions")
                .status("ACTIVE")
                .build());

        SalaryStructure structExec = salaryStructureRepository.save(SalaryStructure.builder()
                .name("Executive Management")
                .description("Executive compensation package with performance allowances")
                .status("ACTIVE")
                .build());

        SalaryStructure structSales = salaryStructureRepository.save(SalaryStructure.builder()
                .name("Sales Commission Base")
                .description("Base salary structure with commission incentives for sales team")
                .status("ACTIVE")
                .build());

        // Salary Rules
        SalaryRule ruleBasic = salaryRuleRepository.save(SalaryRule.builder()
                .salaryStructure(structRegular)
                .name("Basic Salary")
                .code("BASIC")
                .sequence(1)
                .category("BASIC")
                .calculationType("PERCENTAGE")
                .percentage(new BigDecimal("50.00"))
                .formula("contract.wage * 0.50")
                .active(true)
                .build());

        SalaryRule ruleHra = salaryRuleRepository.save(SalaryRule.builder()
                .salaryStructure(structRegular)
                .name("House Rent Allowance (HRA)")
                .code("HRA")
                .sequence(2)
                .category("ALW")
                .calculationType("PERCENTAGE")
                .percentage(new BigDecimal("25.00"))
                .formula("contract.wage * 0.25")
                .active(true)
                .build());

        SalaryRule ruleTrans = salaryRuleRepository.save(SalaryRule.builder()
                .salaryStructure(structRegular)
                .name("Transport Conveyance")
                .code("TRANS")
                .sequence(3)
                .category("ALW")
                .calculationType("FIXED")
                .value(new BigDecimal("300.00"))
                .formula("300")
                .active(true)
                .build());

        SalaryRule ruleGross = salaryRuleRepository.save(SalaryRule.builder()
                .salaryStructure(structRegular)
                .name("Gross Salary")
                .code("GROSS")
                .sequence(4)
                .category("GROSS")
                .calculationType("FORMULA")
                .formula("BASIC + HRA + TRANS")
                .active(true)
                .build());

        SalaryRule ruleTax = salaryRuleRepository.save(SalaryRule.builder()
                .salaryStructure(structRegular)
                .name("Income Tax Withholding (10%)")
                .code("TAX")
                .sequence(5)
                .category("DED")
                .calculationType("PERCENTAGE")
                .percentage(new BigDecimal("10.00"))
                .formula("GROSS * 0.10")
                .active(true)
                .build());

        SalaryRule rulePf = salaryRuleRepository.save(SalaryRule.builder()
                .salaryStructure(structRegular)
                .name("Provident Fund (5%)")
                .code("PF")
                .sequence(6)
                .category("DED")
                .calculationType("PERCENTAGE")
                .percentage(new BigDecimal("5.00"))
                .formula("BASIC * 0.05")
                .active(true)
                .build());

        SalaryRule ruleNet = salaryRuleRepository.save(SalaryRule.builder()
                .salaryStructure(structRegular)
                .name("Net Pay")
                .code("NET")
                .sequence(7)
                .category("NET")
                .calculationType("FORMULA")
                .formula("GROSS - TAX - PF")
                .active(true)
                .build());

        // 5. Employees (Matches 1-click Demo credentials)
        Employee empSarah = employeeRepository.save(Employee.builder()
                .authProviderUserId("admin@company.com")
                .employeeCode("EMP-001")
                .firstName("Sarah")
                .lastName("Connor")
                .email("admin@company.com")
                .phone("+1 555-0101")
                .dateOfBirth(LocalDate.of(1990, 5, 12))
                .address("742 Evergreen Terrace, Springfield")
                .department(deptEng)
                .jobPosition(jobDev)
                .joiningDate(LocalDate.of(2023, 1, 15))
                .employeeType("FULL_TIME")
                .status("ACTIVE")
                .bankAccountNo("US98234710293847")
                .bankName("Chase Bank")
                .ifscCode("CHASUS33")
                .emergencyContactName("John Connor")
                .emergencyContactPhone("+1 555-0199")
                .build());

        Employee empMichael = employeeRepository.save(Employee.builder()
                .authProviderUserId("hrmanager@company.com")
                .employeeCode("EMP-002")
                .firstName("Michael")
                .lastName("Scott")
                .email("hrmanager@company.com")
                .phone("+1 555-0102")
                .dateOfBirth(LocalDate.of(1982, 3, 15))
                .address("1725 Slough Avenue, Scranton, PA")
                .department(deptHr)
                .jobPosition(jobHrDir)
                .joiningDate(LocalDate.of(2022, 6, 1))
                .employeeType("FULL_TIME")
                .status("ACTIVE")
                .bankAccountNo("US12389471928374")
                .bankName("Wells Fargo")
                .ifscCode("WFBIUS6S")
                .emergencyContactName("Jan Levinson")
                .emergencyContactPhone("+1 555-0198")
                .build());

        Employee empDwight = employeeRepository.save(Employee.builder()
                .authProviderUserId("employee@company.com")
                .employeeCode("EMP-003")
                .firstName("Dwight")
                .lastName("Schrute")
                .email("employee@company.com")
                .phone("+1 555-0103")
                .dateOfBirth(LocalDate.of(1985, 1, 20))
                .address("Schrute Farms, Honesdale, PA")
                .department(deptSales)
                .jobPosition(jobSalesExec)
                .manager(empMichael)
                .joiningDate(LocalDate.of(2022, 9, 10))
                .employeeType("FULL_TIME")
                .status("ACTIVE")
                .bankAccountNo("US48291039482716")
                .bankName("PNC Bank")
                .ifscCode("PNCCUS33")
                .emergencyContactName("Mose Schrute")
                .emergencyContactPhone("+1 555-0197")
                .build());

        Employee empPam = employeeRepository.save(Employee.builder()
                .authProviderUserId("pam@company.com")
                .employeeCode("EMP-004")
                .firstName("Pam")
                .lastName("Beesly")
                .email("pam@company.com")
                .phone("+1 555-0104")
                .dateOfBirth(LocalDate.of(1988, 3, 25))
                .address("42 Elm Street, Scranton, PA")
                .department(deptMkt)
                .jobPosition(jobMktLead)
                .manager(empMichael)
                .joiningDate(LocalDate.of(2023, 3, 1))
                .employeeType("FULL_TIME")
                .status("ACTIVE")
                .bankAccountNo("US71928340192837")
                .bankName("Bank of America")
                .ifscCode("BOFAUS3N")
                .emergencyContactName("Roy Anderson")
                .emergencyContactPhone("+1 555-0196")
                .build());

        Employee empJim = employeeRepository.save(Employee.builder()
                .authProviderUserId("jim@company.com")
                .employeeCode("EMP-005")
                .firstName("Jim")
                .lastName("Halpert")
                .email("jim@company.com")
                .phone("+1 555-0105")
                .dateOfBirth(LocalDate.of(1987, 10, 1))
                .address("12 Oak Avenue, Scranton, PA")
                .department(deptEng)
                .jobPosition(jobOps)
                .manager(empSarah)
                .joiningDate(LocalDate.of(2023, 2, 15))
                .employeeType("FULL_TIME")
                .status("ACTIVE")
                .bankAccountNo("US62910384729102")
                .bankName("Citibank")
                .ifscCode("CITIUS33")
                .emergencyContactName("Pete Halpert")
                .emergencyContactPhone("+1 555-0195")
                .build());

        // Assign department managers
        deptEng.setManager(empSarah);
        deptHr.setManager(empMichael);
        deptSales.setManager(empDwight);
        deptMkt.setManager(empPam);
        deptFin.setManager(empSarah);
        departmentRepository.saveAll(List.of(deptEng, deptHr, deptSales, deptMkt, deptFin));

        // 6. Contracts
        Contract c1 = contractRepository.save(Contract.builder()
                .employee(empSarah)
                .contractType("PERMANENT")
                .startDate(LocalDate.of(2023, 1, 15))
                .salary(new BigDecimal("6500.00"))
                .salaryStructure(structRegular)
                .workingSchedule(schedule40)
                .status("RUNNING")
                .build());

        Contract c2 = contractRepository.save(Contract.builder()
                .employee(empMichael)
                .contractType("PERMANENT")
                .startDate(LocalDate.of(2022, 6, 1))
                .salary(new BigDecimal("8200.00"))
                .salaryStructure(structExec)
                .workingSchedule(schedule40)
                .status("RUNNING")
                .build());

        Contract c3 = contractRepository.save(Contract.builder()
                .employee(empDwight)
                .contractType("PERMANENT")
                .startDate(LocalDate.of(2022, 9, 10))
                .salary(new BigDecimal("5400.00"))
                .salaryStructure(structSales)
                .workingSchedule(schedule40)
                .status("RUNNING")
                .build());

        Contract c4 = contractRepository.save(Contract.builder()
                .employee(empPam)
                .contractType("PERMANENT")
                .startDate(LocalDate.of(2023, 3, 1))
                .salary(new BigDecimal("4800.00"))
                .salaryStructure(structRegular)
                .workingSchedule(schedule40)
                .status("RUNNING")
                .build());

        Contract c5 = contractRepository.save(Contract.builder()
                .employee(empJim)
                .contractType("PERMANENT")
                .startDate(LocalDate.of(2023, 2, 15))
                .salary(new BigDecimal("7000.00"))
                .salaryStructure(structRegular)
                .workingSchedule(schedule40)
                .status("RUNNING")
                .build());

        // 7. Time Off Types & Allocations
        TimeOffType typeAnnual = timeOffTypeRepository.save(TimeOffType.builder()
                .name("Annual Paid Leave")
                .description("Standard paid time off allocation")
                .paid(true)
                .requiresApproval(true)
                .status("ACTIVE")
                .build());

        TimeOffType typeSick = timeOffTypeRepository.save(TimeOffType.builder()
                .name("Sick Leave")
                .description("Medical leave for illness and health appointments")
                .paid(true)
                .requiresApproval(false)
                .status("ACTIVE")
                .build());

        TimeOffType typeUnpaid = timeOffTypeRepository.save(TimeOffType.builder()
                .name("Unpaid Leave")
                .description("Leave of absence without compensation")
                .paid(false)
                .requiresApproval(true)
                .status("ACTIVE")
                .build());

        List<Employee> allEmployees = List.of(empSarah, empMichael, empDwight, empPam, empJim);
        LocalDate yearStart = LocalDate.of(2026, 1, 1);
        LocalDate yearEnd = LocalDate.of(2026, 12, 31);

        for (Employee emp : allEmployees) {
            timeOffAllocationRepository.save(TimeOffAllocation.builder()
                    .employee(emp)
                    .timeOffType(typeAnnual)
                    .periodStart(yearStart)
                    .periodEnd(yearEnd)
                    .allocatedDays(new BigDecimal("24.00"))
                    .usedDays(new BigDecimal("2.00"))
                    .remainingDays(new BigDecimal("22.00"))
                    .build());

            timeOffAllocationRepository.save(TimeOffAllocation.builder()
                    .employee(emp)
                    .timeOffType(typeSick)
                    .periodStart(yearStart)
                    .periodEnd(yearEnd)
                    .allocatedDays(new BigDecimal("12.00"))
                    .usedDays(BigDecimal.ZERO)
                    .remainingDays(new BigDecimal("12.00"))
                    .build());
        }

        // Sample Leave Requests
        timeOffRequestRepository.save(TimeOffRequest.builder()
                .employee(empDwight)
                .timeOffType(typeSick)
                .startDate(LocalDate.now().plusDays(2))
                .endDate(LocalDate.now().plusDays(3))
                .duration(new BigDecimal("2.00"))
                .reason("Dental surgery recovery")
                .status("PENDING")
                .build());

        timeOffRequestRepository.save(TimeOffRequest.builder()
                .employee(empPam)
                .timeOffType(typeAnnual)
                .startDate(LocalDate.now().plusDays(10))
                .endDate(LocalDate.now().plusDays(12))
                .duration(new BigDecimal("3.00"))
                .reason("Family vacation trip")
                .status("APPROVED")
                .approvedBy(empMichael)
                .approvedAt(OffsetDateTime.now().minusDays(1))
                .build());

        // 8. Attendance Logs
        LocalDate today = LocalDate.now();
        attendanceRepository.save(Attendance.builder()
                .employee(empSarah)
                .attendanceDate(today)
                .checkIn(OffsetDateTime.now().withHour(9).withMinute(2))
                .scheduledHours(new BigDecimal("8.00"))
                .status("PRESENT")
                .build());

        attendanceRepository.save(Attendance.builder()
                .employee(empJim)
                .attendanceDate(today)
                .checkIn(OffsetDateTime.now().withHour(8).withMinute(55))
                .scheduledHours(new BigDecimal("8.00"))
                .status("PRESENT")
                .build());

        attendanceRepository.save(Attendance.builder()
                .employee(empMichael)
                .attendanceDate(today)
                .checkIn(OffsetDateTime.now().withHour(9).withMinute(30))
                .scheduledHours(new BigDecimal("8.00"))
                .status("PRESENT")
                .build());

        // 9. September 2026 Payrun & Payslips
        Payrun payrun = Payrun.builder()
                .periodStart(LocalDate.of(2026, 9, 1))
                .periodEnd(LocalDate.of(2026, 9, 30))
                .salaryStructure(structRegular)
                .status("PAID")
                .createdBy("admin@company.com")
                .calculatedAt(OffsetDateTime.now().minusDays(5))
                .validatedAt(OffsetDateTime.now().minusDays(3))
                .paidAt(OffsetDateTime.now().minusDays(1))
                .build();
        payrun = payrunRepository.save(payrun);

        // Payslips
        Payslip ps1 = payslipRepository.save(Payslip.builder()
                .payrun(payrun)
                .employee(empSarah)
                .contract(c1)
                .salaryStructure(structRegular)
                .periodStart(LocalDate.of(2026, 9, 1))
                .periodEnd(LocalDate.of(2026, 9, 30))
                .grossSalary(new BigDecimal("6500.00"))
                .totalDeductions(new BigDecimal("812.50"))
                .netSalary(new BigDecimal("5687.50"))
                .status("PAID")
                .build());

        payslipLineRepository.save(PayslipLine.builder().payslip(ps1).ruleCode("BASIC").ruleName("Basic Salary").category("BASIC").amount(new BigDecimal("3250.00")).sequence(1).build());
        payslipLineRepository.save(PayslipLine.builder().payslip(ps1).ruleCode("HRA").ruleName("House Rent Allowance (HRA)").category("ALW").amount(new BigDecimal("1625.00")).sequence(2).build());
        payslipLineRepository.save(PayslipLine.builder().payslip(ps1).ruleCode("TRANS").ruleName("Transport Conveyance").category("ALW").amount(new BigDecimal("300.00")).sequence(3).build());
        payslipLineRepository.save(PayslipLine.builder().payslip(ps1).ruleCode("TAX").ruleName("Income Tax Withholding (10%)").category("DED").amount(new BigDecimal("650.00")).sequence(4).build());
        payslipLineRepository.save(PayslipLine.builder().payslip(ps1).ruleCode("PF").ruleName("Provident Fund (5%)").category("DED").amount(new BigDecimal("162.50")).sequence(5).build());

        Payslip ps2 = payslipRepository.save(Payslip.builder()
                .payrun(payrun)
                .employee(empMichael)
                .contract(c2)
                .salaryStructure(structExec)
                .periodStart(LocalDate.of(2026, 9, 1))
                .periodEnd(LocalDate.of(2026, 9, 30))
                .grossSalary(new BigDecimal("8200.00"))
                .totalDeductions(new BigDecimal("1025.00"))
                .netSalary(new BigDecimal("7175.00"))
                .status("PAID")
                .build());

        payslipLineRepository.save(PayslipLine.builder().payslip(ps2).ruleCode("BASIC").ruleName("Basic Salary").category("BASIC").amount(new BigDecimal("4100.00")).sequence(1).build());
        payslipLineRepository.save(PayslipLine.builder().payslip(ps2).ruleCode("HRA").ruleName("House Rent Allowance").category("ALW").amount(new BigDecimal("1100.00")).sequence(2).build());
        payslipLineRepository.save(PayslipLine.builder().payslip(ps2).ruleCode("EXEC").ruleName("Executive Allowance").category("ALW").amount(new BigDecimal("2500.00")).sequence(3).build());
        payslipLineRepository.save(PayslipLine.builder().payslip(ps2).ruleCode("TAX").ruleName("Income Tax Withholding").category("DED").amount(new BigDecimal("820.00")).sequence(4).build());
        payslipLineRepository.save(PayslipLine.builder().payslip(ps2).ruleCode("PF").ruleName("Provident Fund").category("DED").amount(new BigDecimal("205.00")).sequence(5).build());

        log.info("Enterprise HRMS database seeding successfully completed!");
    }
}
