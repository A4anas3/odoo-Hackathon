package com.odoo.hr.payroll.service;

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
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
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

            Optional<Contract> runningContract = contractRepository.findFirstByEmployeeIdAndStatus(emp.getId(), "RUNNING");
            if (runningContract.isEmpty()) {
                log.warn("Skipping employee {} (id={}): no active/running contract found", emp.getFullName(), emp.getId());
                continue;
            }

            Contract contract = runningContract.get();
            SalaryStructure employeeStructure = contract.getSalaryStructure() != null
                    ? contract.getSalaryStructure() : structure;

            Payslip payslip = calculatePayslipForEmployee(payrun, emp, contract, employeeStructure,
                    request.getPeriodStart(), request.getPeriodEnd());

            payrun.getPayslips().add(payslip);
        }

        Payrun saved = payrunRepository.save(payrun);
        log.info("Generated Payrun (id={}) with {} payslips for period [{} - {}]",
                saved.getId(), saved.getPayslips().size(), saved.getPeriodStart(), saved.getPeriodEnd());

        return PayrunResponse.fromEntity(saved, true);
    }

    private Payslip calculatePayslipForEmployee(Payrun payrun, Employee emp, Contract contract,
                                                SalaryStructure structure,
                                                LocalDate periodStart, LocalDate periodEnd) {
        BigDecimal baseSalary = contract.getSalary() != null ? contract.getSalary() : BigDecimal.ZERO;
        BigDecimal gross = BigDecimal.ZERO;
        BigDecimal deductions = BigDecimal.ZERO;

        List<PayslipLine> lines = new ArrayList<>();
        Map<String, BigDecimal> ruleAmounts = new HashMap<>();
        ruleAmounts.put("contract.wage", baseSalary);
        ruleAmounts.put("wage", baseSalary);
        ruleAmounts.put("BASE", baseSalary);

        int seq = 1;

        if (structure != null) {
            List<SalaryRule> rules = salaryRuleRepository.findBySalaryStructureIdOrderBySequenceAsc(structure.getId());
            for (SalaryRule rule : rules) {
                if (!Boolean.TRUE.equals(rule.getActive())) continue;

                BigDecimal amount = evaluateSalaryRule(rule, baseSalary, gross, ruleAmounts);
                ruleAmounts.put(rule.getCode(), amount);

                String cat = rule.getCategory() != null ? rule.getCategory().toUpperCase() : "ALW";
                if ("DED".equals(cat) || "DEDUCTION".equals(cat) || "TAX".equals(cat)) {
                    deductions = deductions.add(amount);
                } else if ("GROSS".equals(cat)) {
                    // Update gross if explicitly defined, otherwise accumulates
                    gross = amount;
                } else if ("NET".equals(cat)) {
                    // Will be computed at the end
                } else {
                    gross = gross.add(amount);
                }

                // Update context for formula dependencies
                ruleAmounts.put("GROSS", gross);
                ruleAmounts.put("DED", deductions);

                lines.add(PayslipLine.builder()
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

        if (lines.isEmpty()) {
            // Default calculation when no custom rules configured
            gross = baseSalary;
            lines.add(PayslipLine.builder()
                    .ruleCode("BASIC")
                    .ruleName("Basic Salary")
                    .category("BASIC")
                    .calculationType("BASE")
                    .amount(baseSalary)
                    .sequence(seq++)
                    .build());
        }

        BigDecimal net = gross.subtract(deductions);
        if (net.compareTo(BigDecimal.ZERO) < 0) {
            net = BigDecimal.ZERO;
        }

        Payslip slip = Payslip.builder()
                .payrun(payrun)
                .employee(emp)
                .contract(contract)
                .salaryStructure(structure)
                .periodStart(periodStart)
                .periodEnd(periodEnd)
                .grossSalary(gross)
                .totalDeductions(deductions)
                .netSalary(net)
                .status("DRAFT")
                .lines(lines)
                .build();

        lines.forEach(l -> l.setPayslip(slip));
        return slip;
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

            // If formula references a specific code, use that base
            if (rule.getFormula() != null && !rule.getFormula().isBlank()) {
                String ref = rule.getFormula().trim();
                if (context.containsKey(ref)) {
                    base = context.get(ref);
                }
            }

            return base.multiply(rule.getPercentage()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        if ("FORMULA".equals(type) && rule.getFormula() != null && !rule.getFormula().isBlank()) {
            try {
                StandardEvaluationContext evalCtx = new StandardEvaluationContext();
                for (Map.Entry<String, BigDecimal> entry : context.entrySet()) {
                    evalCtx.setVariable(entry.getKey().replace(".", "_"), entry.getValue().doubleValue());
                }
                evalCtx.setVariable("contract_wage", baseSalary.doubleValue());
                evalCtx.setVariable("wage", baseSalary.doubleValue());
                evalCtx.setVariable("GROSS", currentGross.doubleValue());

                String exprStr = rule.getFormula()
                        .replace("contract.wage", "#contract_wage")
                        .replace("wage", "#wage")
                        .replace("BASIC", "#BASIC")
                        .replace("HRA", "#HRA")
                        .replace("TRANS", "#TRANS")
                        .replace("GROSS", "#GROSS")
                        .replace("TAX", "#TAX")
                        .replace("PF", "#PF")
                        .replace("DED", "#DED");

                Expression expr = spelParser.parseExpression(exprStr);
                Double result = expr.getValue(evalCtx, Double.class);
                if (result != null) {
                    return BigDecimal.valueOf(result).setScale(2, RoundingMode.HALF_UP);
                }
            } catch (Exception e) {
                log.warn("SpEL evaluation failed for formula '{}': {}. Falling back to percentage/fixed.",
                        rule.getFormula(), e.getMessage());
            }
        }

        return rule.getValue() != null ? rule.getValue() : baseSalary;
    }

    /**
     * Resolves the current employee from JWT 'sub' and returns all their payslips.
     */
    @Transactional(readOnly = true)
    public List<PayslipResponse> getMyPayslips() {
        UUID employeeId = currentEmployeeService.getCurrentEmployeeId();
        return payslipRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId).stream()
                .map(PayslipResponse::fromEntity)
                .toList();
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

        if (!"DRAFT".equals(payrun.getStatus())) {
            throw new ConflictException("Payrun is already " + payrun.getStatus());
        }

        payrun.setStatus("VALIDATED");
        payrun.setValidatedAt(OffsetDateTime.now());
        payrun.getPayslips().forEach(p -> p.setStatus("CONFIRMED"));

        Payrun updated = payrunRepository.save(payrun);
        return PayrunResponse.fromEntity(updated, true);
    }

    @Transactional
    public PayrunResponse payPayrun(UUID payrunId) {
        Payrun payrun = payrunRepository.findById(payrunId)
                .orElseThrow(() -> new ResourceNotFoundException("Payrun not found with id: " + payrunId));

        if (!"VALIDATED".equals(payrun.getStatus()) && !"DRAFT".equals(payrun.getStatus())) {
            throw new ConflictException("Payrun must be in VALIDATED or DRAFT status before paying");
        }

        payrun.setStatus("PAID");
        payrun.setPaidAt(OffsetDateTime.now());
        payrun.getPayslips().forEach(p -> p.setStatus("PAID"));

        Payrun updated = payrunRepository.save(payrun);
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
}
