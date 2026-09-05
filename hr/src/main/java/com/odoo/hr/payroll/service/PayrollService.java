package com.odoo.hr.payroll.service;

import com.odoo.hr.common.exception.ConflictException;
import com.odoo.hr.common.exception.ResourceNotFoundException;
import com.odoo.hr.contract.model.Contract;
import com.odoo.hr.contract.repository.ContractRepository;
import com.odoo.hr.employee.model.Employee;
import com.odoo.hr.employee.repository.EmployeeRepository;
import com.odoo.hr.payroll.dto.GeneratePayrunRequest;
import com.odoo.hr.payroll.dto.PayrunResponse;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
        BigDecimal baseSalary = contract.getSalary();
        BigDecimal gross = BigDecimal.ZERO;
        BigDecimal deductions = BigDecimal.ZERO;

        List<PayslipLine> lines = new ArrayList<>();
        int seq = 1;

        if (structure != null && !structure.getRules().isEmpty()) {
            List<SalaryRule> rules = salaryRuleRepository.findBySalaryStructureIdOrderBySequenceAsc(structure.getId());
            for (SalaryRule rule : rules) {
                if (!Boolean.TRUE.equals(rule.getActive())) continue;

                BigDecimal amount = BigDecimal.ZERO;
                if ("FIXED".equalsIgnoreCase(rule.getCalculationType()) && rule.getValue() != null) {
                    amount = rule.getValue();
                } else if ("PERCENTAGE".equalsIgnoreCase(rule.getCalculationType()) && rule.getPercentage() != null) {
                    amount = baseSalary.multiply(rule.getPercentage()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                } else {
                    amount = baseSalary;
                }

                if ("DED".equalsIgnoreCase(rule.getCategory()) || "TAX".equalsIgnoreCase(rule.getCategory())) {
                    deductions = deductions.add(amount);
                } else {
                    gross = gross.add(amount);
                }

                lines.add(PayslipLine.builder()
                        .salaryRule(rule)
                        .ruleCode(rule.getCode())
                        .ruleName(rule.getName())
                        .category(rule.getCategory())
                        .calculationType(rule.getCalculationType())
                        .amount(amount)
                        .sequence(rule.getSequence() != null ? rule.getSequence() : seq++)
                        .build());
            }
        } else {
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

        if (!"VALIDATED".equals(payrun.getStatus())) {
            throw new ConflictException("Payrun must be in VALIDATED status before paying");
        }

        payrun.setStatus("PAID");
        payrun.setPaidAt(OffsetDateTime.now());
        payrun.getPayslips().forEach(p -> p.setStatus("PAID"));

        Payrun updated = payrunRepository.save(payrun);
        return PayrunResponse.fromEntity(updated, true);
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
                                || a.getAuthority().contains("HR_PAYROLL"));
            if (!isPrivileged) {
                throw new ConflictException("You are not authorized to download another employee's payslip.");
            }
        }

        return payslipPdfService.generatePayslipPdf(payslip);
    }
}
