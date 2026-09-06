package com.odoo.hr.payroll.service;

import com.odoo.hr.attendance.model.Attendance;
import com.odoo.hr.attendance.repository.AttendanceRepository;
import com.odoo.hr.common.exception.ConflictException;
import com.odoo.hr.common.exception.ResourceNotFoundException;
import com.odoo.hr.contract.model.Contract;
import com.odoo.hr.contract.repository.ContractRepository;
import com.odoo.hr.employee.model.Employee;
import com.odoo.hr.employee.repository.EmployeeRepository;
import com.odoo.hr.payroll.config.RabbitMqPayrollConfig;
import com.odoo.hr.payroll.dto.GeneratePayrunRequest;
import com.odoo.hr.payroll.dto.PayrunResponse;
import com.odoo.hr.payroll.dto.PayslipEmailMessage;
import com.odoo.hr.payroll.dto.PayslipResponse;
import com.odoo.hr.payroll.dto.SalaryPreviewRequest;
import com.odoo.hr.payroll.dto.SalaryPreviewResponse;
import com.odoo.hr.payroll.model.Payrun;
import com.odoo.hr.payroll.model.Payslip;
import com.odoo.hr.payroll.model.PayslipLine;
import com.odoo.hr.payroll.repository.PayrunRepository;
import com.odoo.hr.payroll.repository.PayslipRepository;
import com.odoo.hr.salary.model.SalaryRule;
import com.odoo.hr.salary.model.SalaryStructure;
import com.odoo.hr.salary.repository.SalaryRuleRepository;
import com.odoo.hr.salary.repository.SalaryStructureRepository;
import com.odoo.hr.security.CurrentEmployeeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.expression.MapAccessor;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayrollService {

    private final PayrunRepository payrunRepository;
    private final PayslipRepository payslipRepository;
    private final EmployeeRepository employeeRepository;
    private final ContractRepository contractRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final SalaryRuleRepository salaryRuleRepository;
    private final CurrentEmployeeService currentEmployeeService;
    private final PayslipPdfService payslipPdfService;
    private final RabbitTemplate rabbitTemplate;
    private final EmailService emailService;
    private final PayslipRedisCacheService payslipRedisCacheService;
    private final AttendanceRepository attendanceRepository;

    private final ExpressionParser spelParser = new SpelExpressionParser();

    @Transactional
    public PayrunResponse generatePayrun(GeneratePayrunRequest request) {
        if (request.getPeriodEnd().isBefore(request.getPeriodStart())) {
            throw new IllegalArgumentException("Period end date cannot be before period start date");
        }

        Employee currentEmployee = currentEmployeeService.getCurrentEmployee();
        if (currentEmployee.getStatus() == null || !"ACTIVE".equalsIgnoreCase(currentEmployee.getStatus())) {
            throw new ConflictException("Terminated or inactive employees cannot generate payroll payruns.");
        }

        String currentJwtSub = currentEmployeeService.getAuthenticatedAuthProviderUserId();

        SalaryStructure structure = null;
        if (request.getSalaryStructureId() != null) {
            structure = salaryStructureRepository.findById(request.getSalaryStructureId())
                    .orElseThrow(() -> new ResourceNotFoundException("SalaryStructure not found: " + request.getSalaryStructureId()));
        }

        Payrun payrun = Payrun.builder()
                .periodStart(request.getPeriodStart())
                .periodEnd(request.getPeriodEnd())
                .salaryStructure(structure)
                .status("DRAFT")
                .createdBy(currentJwtSub)
                .calculatedAt(OffsetDateTime.now())
                .payslips(new ArrayList<>())
                .build();

        List<Employee> targetEmployees;
        if (request.getEmployeeIds() != null && !request.getEmployeeIds().isEmpty()) {
            targetEmployees = employeeRepository.findAllById(request.getEmployeeIds()).stream()
                    .filter(e -> e.getStatus() != null && "ACTIVE".equalsIgnoreCase(e.getStatus()))
                    .toList();
        } else {
            targetEmployees = employeeRepository.findByStatus("ACTIVE");
        }

        for (Employee emp : targetEmployees) {
            // Check if payslip already exists for this period
            if (payslipRepository.existsByEmployeeIdAndPeriodStartAndPeriodEnd(
                    emp.getId(), request.getPeriodStart(), request.getPeriodEnd())) {
                log.info("Payslip already exists for employee {} in period [{} - {}], skipping.",
                        emp.getFullName(), request.getPeriodStart(), request.getPeriodEnd());
                continue;
            }

            List<Contract> applicableContracts = contractRepository.findApplicableContractsForPeriod(
                    emp.getId(), request.getPeriodStart(), request.getPeriodEnd());
            Contract contract = !applicableContracts.isEmpty()
                    ? applicableContracts.get(0)
                    : contractRepository.findFirstByEmployeeIdAndStatus(emp.getId(), "RUNNING").orElse(null);

            if (contract == null) {
                log.warn("Skipping employee {} (id={}): no applicable or running contract found for period [{} - {}]",
                        emp.getFullName(), emp.getId(), request.getPeriodStart(), request.getPeriodEnd());
                continue;
            }

            // If payrun is scoped to a specific salary structure, skip contracts with a different structure
            if (structure != null && contract.getSalaryStructure() != null
                    && !structure.getId().equals(contract.getSalaryStructure().getId())) {
                log.info("Skipping employee {} (id={}): contract structure ({}) does not match payrun structure ({})",
                        emp.getFullName(), emp.getId(),
                        contract.getSalaryStructure().getName(), structure.getName());
                continue;
            }

            SalaryStructure employeeStructure = contract.getSalaryStructure() != null
                    ? contract.getSalaryStructure() : structure;

            Payslip payslip = calculatePayslipForEmployee(payrun, emp, contract, employeeStructure,
                    request.getPeriodStart(), request.getPeriodEnd());

            payrun.getPayslips().add(payslip);
        }

        Payrun saved = payrunRepository.save(payrun);
        for (Payslip savedSlip : saved.getPayslips()) {
            List<Attendance> atts = attendanceRepository.findUnpaidOrCurrentPayslipAttendances(
                    savedSlip.getEmployee().getId(), saved.getPeriodStart(), saved.getPeriodEnd(), savedSlip.getId());
            if (atts != null && !atts.isEmpty()) {
                atts.forEach(a -> a.setPayslip(savedSlip));
                attendanceRepository.saveAll(atts);
            }
        }
        payslipRedisCacheService.revokeAll();
        log.info("Generated Payrun (id={}) with {} payslips for period [{} - {}]",
                saved.getId(), saved.getPayslips().size(), saved.getPeriodStart(), saved.getPeriodEnd());

        return PayrunResponse.fromEntity(saved, true);
    }

    private Payslip calculatePayslipForEmployee(Payrun payrun, Employee emp, Contract contract,
                                                SalaryStructure structure,
                                                LocalDate periodStart, LocalDate periodEnd) {
        Payslip slip = Payslip.builder()
                .payrun(payrun)
                .employee(emp)
                .contract(contract)
                .salaryStructure(structure)
                .periodStart(periodStart)
                .periodEnd(periodEnd)
                .status("DRAFT")
                .lines(new ArrayList<>())
                .build();

        populatePayslipLines(slip, emp, contract, structure, periodStart, periodEnd);
        return slip;
    }

    private boolean isHourlyContract(Contract contract) {
        if (contract == null) return false;
        if (contract.getWageType() != null && !contract.getWageType().isBlank()) {
            return "HOURLY".equalsIgnoreCase(contract.getWageType().trim());
        }
        if (contract.getContractType() != null) {
            String ct = contract.getContractType().toUpperCase();
            if (ct.contains("HOUR") || ct.contains("PART_TIME") || ct.contains("CONTRACTOR")) {
                return true;
            }
        }
        if (contract.getSalaryStructure() != null && contract.getSalaryStructure().getName() != null) {
            String name = contract.getSalaryStructure().getName().toUpperCase();
            if (name.contains("HOURLY") || name.contains("CONTRACTOR")) {
                return true;
            }
        }
        return false;
    }

    private void populatePayslipLines(Payslip slip, Employee emp, Contract contract,
                                      SalaryStructure structure,
                                      LocalDate periodStart, LocalDate periodEnd) {
        BigDecimal contractWage = contract.getSalary() != null ? contract.getSalary() : BigDecimal.ZERO;

        // Check contract wage type (Hourly vs Monthly Salaried)
        boolean isHourly = isHourlyContract(contract);

        // 1. Fetch unpaid attendance records for this period (safe check)
        List<Attendance> attendances = Collections.emptyList();
        if (attendanceRepository != null && emp != null && emp.getId() != null && periodStart != null && periodEnd != null) {
            try {
                UUID payslipId = slip.getId() != null ? slip.getId() : UUID.randomUUID();
                attendances = attendanceRepository.findUnpaidOrCurrentPayslipAttendances(
                        emp.getId(), payslipId, periodStart, periodEnd);
            } catch (Exception e) {
                log.warn("Could not query attendance for employee {} in period [{} - {}]: {}",
                        emp.getId(), periodStart, periodEnd, e.getMessage());
            }
        }

        // 2. Count business days (Mon-Fri) in the period
        int scheduledWorkingDays = 0;
        if (periodStart != null && periodEnd != null) {
            LocalDate curr = periodStart;
            while (!curr.isAfter(periodEnd)) {
                if (curr.getDayOfWeek().getValue() <= 5) {
                    scheduledWorkingDays++;
                }
                curr = curr.plusDays(1);
            }
        }
        if (scheduledWorkingDays == 0) scheduledWorkingDays = 20;

        // 3. Summarize attendance punches
        long presentCount = 0;
        long absentCount = 0;
        BigDecimal totalWorkedHours = BigDecimal.ZERO;
        BigDecimal totalOvertimeHours = BigDecimal.ZERO;

        for (Attendance att : attendances) {
            String stat = att.getStatus() != null ? att.getStatus().toUpperCase() : "PRESENT";
            if ("PRESENT".equals(stat) || "HALF_DAY".equals(stat)) {
                presentCount++;
                if (att.getWorkedHours() != null && att.getWorkedHours().compareTo(BigDecimal.ZERO) > 0) {
                    totalWorkedHours = totalWorkedHours.add(att.getWorkedHours());
                } else {
                    BigDecimal sch = att.getScheduledHours() != null ? att.getScheduledHours() : BigDecimal.valueOf(8);
                    totalWorkedHours = totalWorkedHours.add("HALF_DAY".equals(stat)
                            ? sch.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP) : sch);
                }
            } else if ("ABSENT".equals(stat)) {
                absentCount++;
            }
            if (att.getOvertimeHours() != null && att.getOvertimeHours().compareTo(BigDecimal.ZERO) > 0) {
                totalOvertimeHours = totalOvertimeHours.add(att.getOvertimeHours());
            }
        }

        // 4. Calculate base salary
        BigDecimal baseSalary;
        BigDecimal hourlyRate;
        BigDecimal dailyRate;

        if (isHourly) {
            hourlyRate = contractWage;
            dailyRate = hourlyRate.multiply(BigDecimal.valueOf(8));
            if (!attendances.isEmpty() && totalWorkedHours.compareTo(BigDecimal.ZERO) > 0) {
                baseSalary = hourlyRate.multiply(totalWorkedHours).setScale(2, RoundingMode.HALF_UP);
            } else {
                // Non-breaking fallback: if no punches recorded, use standard schedule hours (e.g. 40h/week -> 8h/day)
                double hoursPerWeek = (contract.getWorkingSchedule() != null && contract.getWorkingSchedule().getHoursPerWeek() > 0)
                        ? contract.getWorkingSchedule().getHoursPerWeek() : 40.0;
                double standardHours = (hoursPerWeek / 5.0) * scheduledWorkingDays;
                totalWorkedHours = BigDecimal.valueOf(standardHours).setScale(1, RoundingMode.HALF_UP);
                baseSalary = hourlyRate.multiply(totalWorkedHours).setScale(2, RoundingMode.HALF_UP);
            }
        } else {
            // Salaried Monthly Contract
            baseSalary = contractWage;
            dailyRate = scheduledWorkingDays > 0
                    ? contractWage.divide(BigDecimal.valueOf(scheduledWorkingDays), 4, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            hourlyRate = dailyRate.divide(BigDecimal.valueOf(8), 4, RoundingMode.HALF_UP);
        }

        BigDecimal gross = BigDecimal.ZERO;
        BigDecimal deductions = BigDecimal.ZERO;

        List<PayslipLine> lines = new ArrayList<>();
        Map<String, BigDecimal> ruleAmounts = new HashMap<>();
        ruleAmounts.put("contract.wage", contractWage);
        ruleAmounts.put("wage", contractWage);
        ruleAmounts.put("contract_wage", contractWage);
        ruleAmounts.put("BASE", baseSalary);
        ruleAmounts.put("BASIC", baseSalary);
        ruleAmounts.put("hourly_rate", hourlyRate);
        ruleAmounts.put("daily_rate", dailyRate);
        ruleAmounts.put("worked_hours", totalWorkedHours);
        ruleAmounts.put("present_days", BigDecimal.valueOf(presentCount));
        ruleAmounts.put("absent_days", BigDecimal.valueOf(absentCount));
        ruleAmounts.put("working_days", BigDecimal.valueOf(scheduledWorkingDays));
        ruleAmounts.put("scheduled_days", BigDecimal.valueOf(scheduledWorkingDays));
        ruleAmounts.put("overtime_hours", totalOvertimeHours);
        ruleAmounts.put("OVERTIME", BigDecimal.ZERO);
        ruleAmounts.put("LOP", BigDecimal.ZERO);
        ruleAmounts.put("PF", BigDecimal.ZERO);
        ruleAmounts.put("PT", BigDecimal.ZERO);
        ruleAmounts.put("HRA", BigDecimal.ZERO);
        ruleAmounts.put("STD", BigDecimal.ZERO);
        ruleAmounts.put("DED", BigDecimal.ZERO);

        int seq = 1;

        // Base wage line
        String baseRuleCode = isHourly ? "HOURLY_BASE" : "BASIC";
        String baseRuleName = isHourly
                ? String.format("Hourly Wages (%s hrs @ %s/hr)", totalWorkedHours.setScale(1, RoundingMode.HALF_UP), hourlyRate.setScale(2, RoundingMode.HALF_UP))
                : "Basic Salary";

        lines.add(PayslipLine.builder()
                .payslip(slip)
                .ruleCode(baseRuleCode)
                .ruleName(baseRuleName)
                .category("BASIC")
                .calculationType("BASE")
                .amount(baseSalary)
                .sequence(seq++)
                .build());

        gross = gross.add(baseSalary);
        ruleAmounts.put("BASIC", baseSalary);
        ruleAmounts.put("GROSS", gross);

        // Attendance Deduction: Loss of Pay (LOP) for unexcused absent days (Salaried monthly only)
        if (!isHourly && absentCount > 0 && dailyRate.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal lopDeduction = dailyRate.multiply(BigDecimal.valueOf(absentCount)).setScale(2, RoundingMode.HALF_UP);
            deductions = deductions.add(lopDeduction);
            ruleAmounts.put("LOP", lopDeduction);
            lines.add(PayslipLine.builder()
                    .payslip(slip)
                    .ruleCode("LOP")
                    .ruleName(String.format("Loss of Pay (%d Days Unpaid Absent)", absentCount))
                    .category("DED")
                    .calculationType("FIXED")
                    .amount(lopDeduction)
                    .sequence(seq++)
                    .build());
        }

        // Attendance Addition: Overtime pay if extra hours worked
        if (totalOvertimeHours.compareTo(BigDecimal.ZERO) > 0 && hourlyRate.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal otRate = hourlyRate.multiply(new BigDecimal("1.50"));
            BigDecimal otPay = otRate.multiply(totalOvertimeHours).setScale(2, RoundingMode.HALF_UP);
            gross = gross.add(otPay);
            ruleAmounts.put("OVERTIME", otPay);
            lines.add(PayslipLine.builder()
                    .payslip(slip)
                    .ruleCode("OVERTIME")
                    .ruleName(String.format("Overtime (%s hrs @ 1.5x)", totalOvertimeHours.setScale(1, RoundingMode.HALF_UP)))
                    .category("ALW")
                    .calculationType("FIXED")
                    .amount(otPay)
                    .sequence(seq++)
                    .build());
        }

        ruleAmounts.put("GROSS", gross);
        ruleAmounts.put("DED", deductions);

        // Now evaluate custom rules from Salary Structure if configured
        if (structure != null) {
            List<SalaryRule> rules = salaryRuleRepository.findBySalaryStructureIdOrderBySequenceAsc(structure.getId());
            for (SalaryRule r : rules) {
                if (r.getCode() != null) {
                    ruleAmounts.putIfAbsent(r.getCode(), BigDecimal.ZERO);
                }
            }
            for (SalaryRule rule : rules) {
                if (!Boolean.TRUE.equals(rule.getActive())) continue;
                if ("BASIC".equalsIgnoreCase(rule.getCode()) || "BASE".equalsIgnoreCase(rule.getCode()) || "HOURLY_BASE".equalsIgnoreCase(rule.getCode())) continue;

                BigDecimal amount = evaluateSalaryRule(rule, baseSalary, gross, ruleAmounts);
                ruleAmounts.put(rule.getCode(), amount);

                String cat = rule.getCategory() != null ? rule.getCategory().toUpperCase() : "ALW";
                if ("DED".equals(cat) || "DEDUCTION".equals(cat) || "TAX".equals(cat)) {
                    deductions = deductions.add(amount);
                } else if ("GROSS".equals(cat)) {
                    gross = amount;
                } else if ("NET".equals(cat) || "NET".equalsIgnoreCase(rule.getCode())) {
                    BigDecimal computedNet = gross.subtract(deductions);
                    amount = computedNet.compareTo(BigDecimal.ZERO) > 0 ? computedNet : BigDecimal.ZERO;
                } else {
                    gross = gross.add(amount);
                }

                ruleAmounts.put("GROSS", gross);
                ruleAmounts.put("DED", deductions);

                lines.add(PayslipLine.builder()
                        .payslip(slip)
                        .salaryRule(rule)
                        .ruleCode(rule.getCode())
                        .ruleName(rule.getName())
                        .category(cat)
                        .calculationType(rule.getCalculationType())
                        .amount(amount)
                        .sequence(rule.getSequence() != null ? rule.getSequence() : seq++)
                        .build());
            }
        }

        BigDecimal net = gross.subtract(deductions);
        if (net.compareTo(BigDecimal.ZERO) < 0) net = BigDecimal.ZERO;

        final BigDecimal finalNet = net;
        lines.forEach(l -> {
            if ("NET".equalsIgnoreCase(l.getCategory()) || "NET".equalsIgnoreCase(l.getRuleCode())) {
                l.setAmount(finalNet);
            }
        });

        slip.getLines().clear();
        slip.getLines().addAll(lines);
        slip.getLines().forEach(l -> l.setPayslip(slip));
        slip.setGrossSalary(gross);
        slip.setTotalDeductions(deductions);
        slip.setNetSalary(net);

        // Link attendance punches to this payslip and mark paid if payslip is already persisted
        if (slip.getId() != null && attendances != null && !attendances.isEmpty()) {
            boolean isPaid = "PAID".equalsIgnoreCase(slip.getStatus());
            for (Attendance att : attendances) {
                att.setPayslip(slip);
                if (isPaid) {
                    att.setIsPaid(true);
                    att.setPaidAt(OffsetDateTime.now());
                }
            }
            attendanceRepository.saveAll(attendances);
        }
    }

    private BigDecimal evaluateSalaryRule(SalaryRule rule, BigDecimal baseSalary, BigDecimal currentGross, Map<String, BigDecimal> context) {
        String type = rule.getCalculationType() != null ? rule.getCalculationType().toUpperCase() : "FIXED";

        if ("FIXED".equals(type)) {
            return rule.getValue() != null ? rule.getValue() : BigDecimal.ZERO;
        }

        if ("PERCENTAGE".equals(type) && rule.getPercentage() != null) {
            BigDecimal base = ("TAX".equalsIgnoreCase(rule.getCategory()) || "DED".equalsIgnoreCase(rule.getCategory()))
                    && currentGross.compareTo(BigDecimal.ZERO) > 0
                    ? currentGross : baseSalary;

            // If formula references a specific code or wage base, use that base
            if (rule.getFormula() != null && !rule.getFormula().isBlank()) {
                String ref = rule.getFormula().trim();
                if (context.containsKey(ref)) {
                    base = context.get(ref);
                } else if (ref.contains("BASIC") && context.containsKey("BASIC")) {
                    base = context.get("BASIC");
                } else if (ref.contains("contract.wage") && context.containsKey("contract.wage")) {
                    base = context.get("contract.wage");
                } else if (ref.contains("contract_wage") && context.containsKey("contract_wage")) {
                    base = context.get("contract_wage");
                } else if (ref.contains("GROSS") && context.containsKey("GROSS")) {
                    base = context.get("GROSS");
                }
            }

            return base.multiply(rule.getPercentage()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        if ("FORMULA".equals(type) && rule.getFormula() != null && !rule.getFormula().isBlank()) {
            try {
                Map<String, Object> rootMap = new HashMap<>();
                for (Map.Entry<String, BigDecimal> entry : context.entrySet()) {
                    rootMap.put(entry.getKey().replace(".", "_"), entry.getValue().doubleValue());
                    rootMap.put(entry.getKey(), entry.getValue().doubleValue());
                }
                rootMap.put("contract_wage", baseSalary.doubleValue());
                rootMap.put("wage", baseSalary.doubleValue());
                rootMap.put("GROSS", currentGross.doubleValue());

                StandardEvaluationContext evalCtx = new StandardEvaluationContext(rootMap);
                evalCtx.addPropertyAccessor(new MapAccessor());

                for (Map.Entry<String, Object> entry : rootMap.entrySet()) {
                    evalCtx.setVariable(entry.getKey(), entry.getValue());
                }

                String exprStr = rule.getFormula().trim();
                exprStr = exprStr.replaceAll("\\bcontract\\.wage\\b", "contract_wage");
                exprStr = exprStr.replace("##", "#");

                Expression expr = spelParser.parseExpression(exprStr);
                Double result = expr.getValue(evalCtx, Double.class);
                if (result != null) {
                    return BigDecimal.valueOf(result).setScale(2, RoundingMode.HALF_UP);
                }
            } catch (Exception e) {
                log.warn("SpEL evaluation failed for formula '{}': {}. Falling back to zero.",
                        rule.getFormula(), e.getMessage());
            }
            return rule.getValue() != null ? rule.getValue() : BigDecimal.ZERO;
        }

        String cat = rule.getCategory() != null ? rule.getCategory().toUpperCase() : "";
        if ("DED".equals(cat) || "DEDUCTION".equals(cat) || "TAX".equals(cat)) {
            return rule.getValue() != null ? rule.getValue() : BigDecimal.ZERO;
        }

        return rule.getValue() != null ? rule.getValue() : baseSalary;
    }

    @Transactional(readOnly = true)
    public List<PayslipResponse> getAllPayslips(UUID payrunId, String departmentName) {
        return getAllPayslips(payrunId, departmentName, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<PayslipResponse> getAllPayslips(UUID payrunId, String departmentName, String month, Integer year) {
        return getAllPayslips(payrunId, departmentName, month, year, null, null);
    }

    @Transactional(readOnly = true)
    public List<PayslipResponse> getAllPayslips(UUID payrunId, String departmentName, String month, Integer year, String search, String status) {
        // 1. Check Redis Cache first
        List<PayslipResponse> cached = payslipRedisCacheService.getCachedPayslips(
                "all", payrunId, departmentName, month, year, search, status);
        if (cached != null) {
            return cached;
        }

        // 2. Query from DB with period/department filters
        List<Payslip> slips;
        boolean hasPeriod = payrunId != null;
        boolean hasDept = departmentName != null && !departmentName.isBlank() && !"ALL".equalsIgnoreCase(departmentName.trim());
        boolean hasMonth = month != null && !month.isBlank() && !"ALL".equalsIgnoreCase(month.trim());

        if (hasPeriod && hasDept) {
            slips = payslipRepository.findByPayrunIdAndDepartmentNameOrderByCreatedAtDesc(payrunId, departmentName.trim());
        } else if (hasPeriod) {
            slips = payslipRepository.findByPayrunIdOrderByCreatedAtDesc(payrunId);
        } else if (hasMonth && hasDept) {
            LocalDate startDate = parseStartDate(month, year);
            LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
            slips = payslipRepository.findByPeriodBetweenAndDepartmentNameOrderByCreatedAtDesc(startDate, endDate, departmentName.trim());
        } else if (hasMonth) {
            LocalDate startDate = parseStartDate(month, year);
            LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
            slips = payslipRepository.findByPeriodBetweenOrderByCreatedAtDesc(startDate, endDate);
        } else if (hasDept) {
            slips = payslipRepository.findByDepartmentNameOrderByCreatedAtDesc(departmentName.trim());
        } else {
            slips = payslipRepository.findAllByOrderByCreatedAtDesc();
        }

        // 3. Apply status filter if provided
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status.trim())) {
            String stat = status.trim().toUpperCase();
            slips = slips.stream().filter(p -> p.getStatus() != null && stat.equalsIgnoreCase(p.getStatus().trim())).toList();
        }

        // 4. Apply search filter if provided
        if (search != null && !search.isBlank()) {
            String q = search.trim().toLowerCase();
            slips = slips.stream().filter(p -> {
                String name = p.getEmployee() != null ? p.getEmployee().getFullName() : "";
                String code = p.getEmployee() != null ? p.getEmployee().getEmployeeCode() : "";
                String struct = p.getSalaryStructure() != null ? p.getSalaryStructure().getName() : "";
                String idStr = p.getId() != null ? p.getId().toString() : "";
                return (name != null && name.toLowerCase().contains(q)) ||
                       (code != null && code.toLowerCase().contains(q)) ||
                       (struct != null && struct.toLowerCase().contains(q)) ||
                       (idStr.toLowerCase().contains(q));
            }).toList();
        }

        List<PayslipResponse> responses = slips.stream().map(PayslipResponse::fromEntity).toList();

        // 5. Store in Redis Cache with TTL
        payslipRedisCacheService.putCachedPayslips(
                "all", payrunId, departmentName, month, year, search, status, responses);

        return responses;
    }

    private LocalDate parseStartDate(String month, Integer year) {
        int y = (year != null && year > 1970) ? year : LocalDate.now().getYear();
        try {
            if (month.contains("-")) {
                String[] parts = month.split("-");
                y = Integer.parseInt(parts[0].trim());
                int m = Integer.parseInt(parts[1].trim());
                return LocalDate.of(y, m, 1);
            }
            if (month.contains("_")) {
                String[] parts = month.split("_");
                if (parts.length >= 2) {
                    try {
                        y = Integer.parseInt(parts[1].trim());
                    } catch (Exception ignored) {}
                    month = parts[0].trim();
                }
            }
            try {
                int m = Integer.parseInt(month.trim());
                return LocalDate.of(y, m, 1);
            } catch (NumberFormatException nfe) {
                for (java.time.Month m : java.time.Month.values()) {
                    if (m.name().equalsIgnoreCase(month.trim()) ||
                        m.name().substring(0, 3).equalsIgnoreCase(month.trim())) {
                        return LocalDate.of(y, m, 1);
                    }
                }
            }
        } catch (Exception ignored) {}
        return LocalDate.of(y, 1, 1);
    }

    @Transactional(readOnly = true)
    public List<PayslipResponse> getMyPayslips() {
        return getMyPayslips(null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<PayslipResponse> getMyPayslips(String month, Integer year, String search, String status) {
        UUID employeeId = currentEmployeeService.getCurrentEmployeeId();
        String scope = "my:" + employeeId;

        // 1. Check Redis Cache
        List<PayslipResponse> cached = payslipRedisCacheService.getCachedPayslips(
                scope, null, null, month, year, search, status);
        if (cached != null) {
            return cached;
        }

        // 2. Query from DB
        List<Payslip> slips;
        boolean hasMonth = month != null && !month.isBlank() && !"ALL".equalsIgnoreCase(month.trim());
        if (hasMonth) {
            LocalDate startDate = parseStartDate(month, year);
            LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
            slips = payslipRepository.findByPeriodBetweenOrderByCreatedAtDesc(startDate, endDate).stream()
                    .filter(p -> p.getEmployee() != null && employeeId.equals(p.getEmployee().getId()))
                    .toList();
        } else {
            slips = payslipRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
        }

        // 3. Apply status filter
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status.trim())) {
            String stat = status.trim().toUpperCase();
            slips = slips.stream().filter(p -> p.getStatus() != null && stat.equalsIgnoreCase(p.getStatus().trim())).toList();
        }

        // 4. Apply search filter
        if (search != null && !search.isBlank()) {
            String q = search.trim().toLowerCase();
            slips = slips.stream().filter(p -> {
                String struct = p.getSalaryStructure() != null ? p.getSalaryStructure().getName() : "";
                String idStr = p.getId() != null ? p.getId().toString() : "";
                return (struct != null && struct.toLowerCase().contains(q)) ||
                       (idStr.toLowerCase().contains(q));
            }).toList();
        }

        List<PayslipResponse> responses = slips.stream().map(PayslipResponse::fromEntity).toList();

        // 5. Store in Redis Cache
        payslipRedisCacheService.putCachedPayslips(
                scope, null, null, month, year, search, status, responses);

        return responses;
    }

    @Transactional
    public PayrunResponse computePayrun(UUID payrunId) {
        Payrun payrun = payrunRepository.findById(payrunId)
                .orElseThrow(() -> new ResourceNotFoundException("Payrun not found with id: " + payrunId));

        if ("PAID".equals(payrun.getStatus())) {
            throw new ConflictException("Cannot recompute a payrun that has already been marked as PAID.");
        }

        SalaryStructure defaultStructure = payrun.getSalaryStructure();

        for (Payslip slip : payrun.getPayslips()) {
            if ("PAID".equals(slip.getStatus())) continue;

            Contract contract = slip.getContract();
            if (contract == null) {
                List<Contract> contracts = contractRepository.findApplicableContractsForPeriod(
                        slip.getEmployee().getId(), payrun.getPeriodStart(), payrun.getPeriodEnd());
                contract = !contracts.isEmpty() ? contracts.get(0)
                        : contractRepository.findFirstByEmployeeIdAndStatus(slip.getEmployee().getId(), "RUNNING").orElse(null);
            }

            SalaryStructure struct = (contract != null && contract.getSalaryStructure() != null)
                    ? contract.getSalaryStructure() : defaultStructure;

            if (contract != null) {
                populatePayslipLines(slip, slip.getEmployee(), contract, struct, payrun.getPeriodStart(), payrun.getPeriodEnd());
                slip.setStatus("DRAFT");
            }
        }

        payrun.setCalculatedAt(OffsetDateTime.now());
        Payrun saved = payrunRepository.save(payrun);
        payslipRedisCacheService.revokeAll();
        return PayrunResponse.fromEntity(saved, true);
    }

    @Transactional
    public PayslipResponse computePayslip(UUID payslipId) {
        Payslip slip = payslipRepository.findById(payslipId)
                .orElseThrow(() -> new ResourceNotFoundException("Payslip not found with id: " + payslipId));

        if ("PAID".equals(slip.getStatus())) {
            throw new ConflictException("Cannot recompute a payslip that has already been marked as PAID.");
        }

        Contract contract = slip.getContract();
        if (contract == null) {
            List<Contract> contracts = contractRepository.findApplicableContractsForPeriod(
                    slip.getEmployee().getId(), slip.getPeriodStart(), slip.getPeriodEnd());
            contract = !contracts.isEmpty() ? contracts.get(0)
                    : contractRepository.findFirstByEmployeeIdAndStatus(slip.getEmployee().getId(), "RUNNING").orElse(null);
        }

        SalaryStructure struct = slip.getSalaryStructure();
        if (struct == null && contract != null) {
            struct = contract.getSalaryStructure();
        }

        if (contract != null) {
            populatePayslipLines(slip, slip.getEmployee(), contract, struct, slip.getPeriodStart(), slip.getPeriodEnd());
            slip.setStatus("DRAFT");
        }

        Payslip updated = payslipRepository.save(slip);
        payslipRedisCacheService.revokeAll();
        return PayslipResponse.fromEntity(updated);
    }

    @Transactional
    public PayslipResponse markPayslipPaid(UUID payslipId) {
        Payslip slip = payslipRepository.findById(payslipId)
                .orElseThrow(() -> new ResourceNotFoundException("Payslip not found with id: " + payslipId));

        slip.setStatus("PAID");
        Payslip updated = payslipRepository.save(slip);

        List<Attendance> atts = attendanceRepository.findByPayslipId(slip.getId());
        if (atts != null && !atts.isEmpty()) {
            OffsetDateTime now = OffsetDateTime.now();
            atts.forEach(a -> {
                a.setIsPaid(true);
                a.setPaidAt(now);
            });
            attendanceRepository.saveAll(atts);
        }

        payslipRedisCacheService.revokeAll();
        return PayslipResponse.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public PayslipResponse getPayslipById(UUID id) {
        Payslip payslip = payslipRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payslip not found with id: " + id));
        return PayslipResponse.fromEntity(payslip);
    }

    @Transactional(readOnly = true)
    public PayrunResponse getPayrunById(UUID id) {
        Payrun payrun = payrunRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payrun not found with id: " + id));
        return PayrunResponse.fromEntity(payrun, true);
    }

    @Transactional(readOnly = true)
    public List<PayrunResponse> getAllPayruns() {
        return payrunRepository.findAllByOrderByPeriodStartDesc().stream()
                .map(p -> PayrunResponse.fromEntity(p, false))
                .toList();
    }

    @Transactional
    public PayrunResponse validatePayrun(UUID payrunId) {
        Employee currentEmployee = currentEmployeeService.getCurrentEmployee();
        if (currentEmployee.getStatus() == null || !"ACTIVE".equalsIgnoreCase(currentEmployee.getStatus())) {
            throw new ConflictException("Terminated or inactive employees cannot validate payroll payruns.");
        }

        Payrun payrun = payrunRepository.findById(payrunId)
                .orElseThrow(() -> new ResourceNotFoundException("Payrun not found with id: " + payrunId));

        if ("PAID".equalsIgnoreCase(payrun.getStatus())) {
            throw new ConflictException("Cannot validate a payrun that has already been marked as PAID.");
        }

        SalaryStructure defaultStructure = payrun.getSalaryStructure();
        for (Payslip slip : payrun.getPayslips()) {
            if ("PAID".equals(slip.getStatus())) continue;

            Contract contract = slip.getContract();
            if (contract == null) {
                List<Contract> contracts = contractRepository.findApplicableContractsForPeriod(
                        slip.getEmployee().getId(), payrun.getPeriodStart(), payrun.getPeriodEnd());
                contract = !contracts.isEmpty() ? contracts.get(0)
                        : contractRepository.findFirstByEmployeeIdAndStatus(slip.getEmployee().getId(), "RUNNING").orElse(null);
            }

            SalaryStructure struct = (contract != null && contract.getSalaryStructure() != null)
                    ? contract.getSalaryStructure() : defaultStructure;

            if (contract != null) {
                populatePayslipLines(slip, slip.getEmployee(), contract, struct, payrun.getPeriodStart(), payrun.getPeriodEnd());
            }
            slip.setStatus("CONFIRMED");
        }

        payrun.setCalculatedAt(OffsetDateTime.now());
        payrun.setStatus("VALIDATED");
        payrun.setValidatedAt(OffsetDateTime.now());

        Payrun updated = payrunRepository.save(payrun);
        payslipRedisCacheService.revokeAll();
        return PayrunResponse.fromEntity(updated, true);
    }

    @Transactional
    @CacheEvict(value = "dashboard", allEntries = true)
    public PayrunResponse payPayrun(UUID payrunId) {
        Payrun payrun = payrunRepository.findById(payrunId)
                .orElseThrow(() -> new ResourceNotFoundException("Payrun not found with id: " + payrunId));

        if (!"VALIDATED".equals(payrun.getStatus()) && !"DRAFT".equals(payrun.getStatus())) {
            throw new ConflictException("Payrun must be in VALIDATED or DRAFT status before paying");
        }

        OffsetDateTime now = OffsetDateTime.now();
        payrun.setStatus("PAID");
        payrun.setPaidAt(now);
        payrun.getPayslips().forEach(p -> {
            p.setStatus("PAID");
            List<Attendance> atts = attendanceRepository.findByPayslipId(p.getId());
            if (atts != null && !atts.isEmpty()) {
                atts.forEach(a -> {
                    a.setIsPaid(true);
                    a.setPaidAt(now);
                });
                attendanceRepository.saveAll(atts);
            }
        });

        Payrun updated = payrunRepository.save(payrun);
        payslipRedisCacheService.revokeAll();
        return PayrunResponse.fromEntity(updated, true);
    }

    /**
     * Asynchronously queues or delivers payslip emails for an entire payrun batch.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> sendPayslipsForPayrun(UUID payrunId) {
        Payrun payrun = payrunRepository.findById(payrunId)
                .orElseThrow(() -> new ResourceNotFoundException("Payrun not found with id: " + payrunId));

        List<Payslip> slips = payrun.getPayslips();
        int queuedCount = 0;

        for (Payslip slip : slips) {
            String email = slip.getEmployee() != null ? slip.getEmployee().getEmail() : null;
            if (email == null || email.isBlank()) continue;

            PayslipEmailMessage message = PayslipEmailMessage.builder()
                    .payslipId(slip.getId())
                    .payrunId(payrun.getId())
                    .employeeId(slip.getEmployee().getId())
                    .employeeName(slip.getEmployee().getFullName())
                    .recipientEmail(email)
                    .periodStart(slip.getPeriodStart())
                    .periodEnd(slip.getPeriodEnd())
                    .grossSalary(slip.getGrossSalary())
                    .totalDeductions(slip.getTotalDeductions())
                    .netSalary(slip.getNetSalary())
                    .currency("USD")
                    .requestedAt(OffsetDateTime.now())
                    .build();

            try {
                rabbitTemplate.convertAndSend(
                        RabbitMqPayrollConfig.PAYROLL_EXCHANGE,
                        RabbitMqPayrollConfig.PAYSLIP_EMAIL_ROUTING_KEY,
                        message
                );
                queuedCount++;
            } catch (Exception ex) {
                log.warn("RabbitMQ broker unavailable ({}). Falling back to direct email dispatch for employee: {}",
                        ex.getMessage(), slip.getEmployee().getFullName());
                try {
                    byte[] pdf = payslipPdfService.generatePayslipPdf(slip);
                    emailService.sendPayslipEmail(
                            email,
                            slip.getEmployee().getFullName(),
                            slip.getPeriodStart(),
                            slip.getPeriodEnd(),
                            slip.getGrossSalary(),
                            slip.getTotalDeductions(),
                            slip.getNetSalary(),
                            pdf
                    );
                    queuedCount++;
                } catch (Exception directEx) {
                    log.error("Direct email fallback failed for employee {}: {}", slip.getEmployee().getFullName(), directEx.getMessage());
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("status", "SUCCESS");
        result.put("payrunId", payrunId);
        result.put("dispatchedCount", queuedCount);
        result.put("totalPayslips", slips.size());
        result.put("message", "Payslips successfully queued for email delivery via RabbitMQ.");
        return result;
    }

    /**
     * Queues or delivers email for an individual payslip.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> sendSinglePayslipEmail(UUID payslipId) {
        Payslip slip = payslipRepository.findById(payslipId)
                .orElseThrow(() -> new ResourceNotFoundException("Payslip not found with id: " + payslipId));

        String email = slip.getEmployee() != null ? slip.getEmployee().getEmail() : null;
        if (email == null || email.isBlank()) {
            throw new ConflictException("Employee has no email address configured.");
        }

        PayslipEmailMessage message = PayslipEmailMessage.builder()
                .payslipId(slip.getId())
                .payrunId(slip.getPayrun() != null ? slip.getPayrun().getId() : null)
                .employeeId(slip.getEmployee().getId())
                .employeeName(slip.getEmployee().getFullName())
                .recipientEmail(email)
                .periodStart(slip.getPeriodStart())
                .periodEnd(slip.getPeriodEnd())
                .grossSalary(slip.getGrossSalary())
                .totalDeductions(slip.getTotalDeductions())
                .netSalary(slip.getNetSalary())
                .currency("USD")
                .requestedAt(OffsetDateTime.now())
                .build();

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMqPayrollConfig.PAYROLL_EXCHANGE,
                    RabbitMqPayrollConfig.PAYSLIP_EMAIL_ROUTING_KEY,
                    message
            );
        } catch (Exception ex) {
            log.warn("RabbitMQ broker unavailable ({}). Delivering directly via EmailService.", ex.getMessage());
            byte[] pdf = payslipPdfService.generatePayslipPdf(slip);
            emailService.sendPayslipEmail(
                    email,
                    slip.getEmployee().getFullName(),
                    slip.getPeriodStart(),
                    slip.getPeriodEnd(),
                    slip.getGrossSalary(),
                    slip.getTotalDeductions(),
                    slip.getNetSalary(),
                    pdf
            );
        }

        Map<String, Object> result = new HashMap<>();
        result.put("status", "SUCCESS");
        result.put("payslipId", payslipId);
        result.put("recipient", email);
        result.put("message", "Payslip email queued for delivery.");
        return result;
    }

    @Transactional(readOnly = true)
    public byte[] generatePayslipPdf(UUID id) {
        Payslip payslip = payslipRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payslip not found with id: " + id));

        Employee currentEmployee = currentEmployeeService.getCurrentEmployee();
        if (currentEmployee != null && currentEmployee.getId() != null && !currentEmployee.getId().equals(payslip.getEmployee().getId())) {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            boolean isPrivileged = auth != null && auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().contains("ADMIN")
                                || a.getAuthority().contains("HR_MANAGER")
                                || a.getAuthority().contains("MANAGER")
                                || a.getAuthority().contains("HR")
                                || a.getAuthority().contains("HR_PAYROLL"));
            if (!isPrivileged) {
                throw new ConflictException("You are not authorized to download another employee's payslip.");
            }
        }

        return payslipPdfService.generatePayslipPdf(payslip);
    }

    @Transactional(readOnly = true)
    public SalaryPreviewResponse calculateSalaryPreview(SalaryPreviewRequest request) {
        BigDecimal baseWage = request.getWage() != null ? request.getWage() : BigDecimal.ZERO;
        if (baseWage.compareTo(BigDecimal.ZERO) < 0) {
            baseWage = BigDecimal.ZERO;
        }

        SalaryStructure structure = null;
        if (request.getSalaryStructureId() != null) {
            structure = salaryStructureRepository.findById(request.getSalaryStructureId()).orElse(null);
        }

        List<SalaryRule> rules = Collections.emptyList();
        if (structure != null) {
            rules = salaryRuleRepository.findBySalaryStructureIdOrderBySequenceAsc(structure.getId());
        }

        Map<String, BigDecimal> overrides = request.getRuleOverrides() != null ? request.getRuleOverrides() : Collections.emptyMap();
        String mode = request.getCalculationMode() != null ? request.getCalculationMode() : "GROSS_LOCK";

        List<SalaryPreviewResponse.SalaryPreviewLineDto> lineDtos = new ArrayList<>();
        BigDecimal gross = BigDecimal.ZERO;
        BigDecimal deductions = BigDecimal.ZERO;
        BigDecimal basicSalary = BigDecimal.ZERO;

        Map<String, BigDecimal> ruleAmounts = new HashMap<>();
        ruleAmounts.put("contract.wage", baseWage);
        ruleAmounts.put("wage", baseWage);
        ruleAmounts.put("contract_wage", baseWage);
        ruleAmounts.put("BASE", baseWage);
        BigDecimal defaultBasic = baseWage.multiply(new BigDecimal("0.50")).setScale(2, RoundingMode.HALF_UP);
        ruleAmounts.put("BASIC", defaultBasic);
        BigDecimal previewDaily = baseWage.divide(BigDecimal.valueOf(20), 4, RoundingMode.HALF_UP);
        BigDecimal previewHourly = previewDaily.divide(BigDecimal.valueOf(8), 4, RoundingMode.HALF_UP);
        ruleAmounts.put("hourly_rate", previewHourly);
        ruleAmounts.put("daily_rate", previewDaily);
        ruleAmounts.put("worked_hours", new BigDecimal("160.0"));
        ruleAmounts.put("present_days", new BigDecimal("20.0"));
        ruleAmounts.put("absent_days", BigDecimal.ZERO);
        ruleAmounts.put("working_days", new BigDecimal("20.0"));
        ruleAmounts.put("scheduled_days", new BigDecimal("20.0"));
        ruleAmounts.put("overtime_hours", BigDecimal.ZERO);
        ruleAmounts.put("OVERTIME", BigDecimal.ZERO);
        ruleAmounts.put("LOP", BigDecimal.ZERO);
        ruleAmounts.put("PF", BigDecimal.ZERO);
        ruleAmounts.put("PT", BigDecimal.ZERO);
        ruleAmounts.put("HRA", BigDecimal.ZERO);
        ruleAmounts.put("STD", BigDecimal.ZERO);
        ruleAmounts.put("DED", BigDecimal.ZERO);

        if (!rules.isEmpty()) {
            for (SalaryRule r : rules) {
                if (r.getCode() != null) {
                    ruleAmounts.putIfAbsent(r.getCode(), BigDecimal.ZERO);
                }
            }
        }

        int activeRuleCount = 0;

        if (!rules.isEmpty()) {
            for (SalaryRule rule : rules) {
                if (!Boolean.TRUE.equals(rule.getActive())) continue;
                activeRuleCount++;

                BigDecimal amount;
                boolean isOverridden = false;

                if (overrides.containsKey(rule.getCode()) && overrides.get(rule.getCode()) != null) {
                    amount = overrides.get(rule.getCode());
                    isOverridden = true;
                } else if ("GROSS_LOCK".equalsIgnoreCase(mode) && "GROSS".equalsIgnoreCase(rule.getCategory())) {
                    amount = baseWage;
                } else {
                    amount = evaluateSalaryRule(rule, baseWage, gross, ruleAmounts);
                }

                if (amount == null) {
                    amount = BigDecimal.ZERO;
                }
                amount = amount.setScale(2, RoundingMode.HALF_UP);
                ruleAmounts.put(rule.getCode(), amount);

                String cat = rule.getCategory() != null ? rule.getCategory().toUpperCase() : "ALW";
                if ("BASIC".equalsIgnoreCase(cat) || "BASIC".equalsIgnoreCase(rule.getCode())) {
                    basicSalary = amount;
                    ruleAmounts.put("BASIC", basicSalary);
                    gross = gross.add(amount);
                } else if ("DED".equalsIgnoreCase(cat) || "DEDUCTION".equalsIgnoreCase(cat) || "TAX".equalsIgnoreCase(cat)) {
                    deductions = deductions.add(amount);
                } else if ("GROSS".equalsIgnoreCase(cat)) {
                    gross = amount;
                } else if ("NET".equalsIgnoreCase(cat)) {
                    // net computed at the end
                } else {
                    gross = gross.add(amount);
                }

                ruleAmounts.put("GROSS", gross);
                ruleAmounts.put("DED", deductions);

                lineDtos.add(SalaryPreviewResponse.SalaryPreviewLineDto.builder()
                        .ruleId(rule.getId())
                        .code(rule.getCode())
                        .name(rule.getName())
                        .category(cat)
                        .calculationType(rule.getCalculationType())
                        .percentage(rule.getPercentage())
                        .formula(rule.getFormula())
                        .value(rule.getValue())
                        .monthly(amount)
                        .annual(amount.multiply(BigDecimal.valueOf(12)))
                        .overridden(isOverridden)
                        .build());
            }
        }

        // If GROSS_LOCK is selected, ensure gross aligns with baseWage by balancing remaining allowance
        if ("GROSS_LOCK".equalsIgnoreCase(mode) && baseWage.compareTo(BigDecimal.ZERO) > 0) {
            gross = baseWage;
            BigDecimal currentAlwSum = BigDecimal.ZERO;
            for (SalaryPreviewResponse.SalaryPreviewLineDto line : lineDtos) {
                if ("ALW".equalsIgnoreCase(line.getCategory()) || "ALLOWANCE".equalsIgnoreCase(line.getCategory())) {
                    currentAlwSum = currentAlwSum.add(line.getMonthly() != null ? line.getMonthly() : BigDecimal.ZERO);
                }
            }
            BigDecimal remainder = baseWage.subtract(basicSalary).subtract(currentAlwSum);
            if (remainder.compareTo(BigDecimal.ZERO) > 0) {
                // Add remainder to the last allowance (e.g. Standard Allowance or Special Allowance) to align exactly with Gross
                for (int i = lineDtos.size() - 1; i >= 0; i--) {
                    SalaryPreviewResponse.SalaryPreviewLineDto line = lineDtos.get(i);
                    if ("ALW".equalsIgnoreCase(line.getCategory()) || "ALLOWANCE".equalsIgnoreCase(line.getCategory())) {
                        BigDecimal currentVal = line.getMonthly() != null ? line.getMonthly() : BigDecimal.ZERO;
                        BigDecimal newVal = currentVal.add(remainder);
                        line.setMonthly(newVal);
                        line.setAnnual(newVal.multiply(BigDecimal.valueOf(12)));
                        break;
                    }
                }
            }
            // Recalculate deductions
            deductions = BigDecimal.ZERO;
            for (SalaryPreviewResponse.SalaryPreviewLineDto line : lineDtos) {
                if ("DED".equalsIgnoreCase(line.getCategory()) || "DEDUCTION".equalsIgnoreCase(line.getCategory()) || "TAX".equalsIgnoreCase(line.getCategory())) {
                    if ("TAX".equalsIgnoreCase(line.getCategory()) && line.getPercentage() != null && line.getPercentage().compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal taxAmt = gross.multiply(line.getPercentage().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)).setScale(2, RoundingMode.HALF_UP);
                        line.setMonthly(taxAmt);
                        line.setAnnual(taxAmt.multiply(BigDecimal.valueOf(12)));
                        deductions = deductions.add(taxAmt);
                    } else {
                        deductions = deductions.add(line.getMonthly() != null ? line.getMonthly() : BigDecimal.ZERO);
                    }
                }
            }
        } else if (gross.compareTo(BigDecimal.ZERO) == 0 && baseWage.compareTo(BigDecimal.ZERO) > 0) {
            gross = baseWage;
        }

        if (activeRuleCount == 0) {
            // When 0 rules configured, preserve data integrity (no fake rules)
            gross = baseWage;
            basicSalary = baseWage;
            deductions = BigDecimal.ZERO;
        }

        if (basicSalary.compareTo(BigDecimal.ZERO) == 0 && gross.compareTo(BigDecimal.ZERO) > 0) {
            basicSalary = gross;
        }

        BigDecimal net = gross.subtract(deductions);
        if (net.compareTo(BigDecimal.ZERO) < 0) {
            net = BigDecimal.ZERO;
        }

        BigDecimal allowances = gross.subtract(basicSalary);
        if (allowances.compareTo(BigDecimal.ZERO) < 0) {
            allowances = BigDecimal.ZERO;
        }

        return SalaryPreviewResponse.builder()
                .baseWage(baseWage)
                .grossSalary(gross)
                .basicSalary(basicSalary)
                .totalAllowances(allowances)
                .totalDeductions(deductions)
                .netSalary(net)
                .annualGross(gross.multiply(BigDecimal.valueOf(12)))
                .annualNet(net.multiply(BigDecimal.valueOf(12)))
                .structureId(structure != null ? structure.getId() : null)
                .structureName(structure != null ? structure.getName() : null)
                .ruleCount(activeRuleCount)
                .lines(lineDtos)
                .build();
    }
}
