package com.odoo.hr.contract.service;

import com.odoo.hr.common.exception.ConflictException;
import com.odoo.hr.common.exception.ResourceNotFoundException;
import com.odoo.hr.contract.dto.ContractRequest;
import com.odoo.hr.contract.dto.ContractResponse;
import com.odoo.hr.contract.model.Contract;
import com.odoo.hr.contract.repository.ContractRepository;
import com.odoo.hr.employee.model.Employee;
import com.odoo.hr.employee.repository.EmployeeRepository;
import com.odoo.hr.salary.model.SalaryStructure;
import com.odoo.hr.salary.repository.SalaryStructureRepository;
import com.odoo.hr.schedule.model.WorkingSchedule;
import com.odoo.hr.schedule.repository.WorkingScheduleRepository;
import com.odoo.hr.security.CurrentEmployeeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final EmployeeRepository employeeRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final WorkingScheduleRepository workingScheduleRepository;
    private final CurrentEmployeeService currentEmployeeService;

    @Transactional
    public ContractResponse createContract(ContractRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + request.getEmployeeId()));

        String status = request.getStatus() != null ? request.getStatus().trim().toUpperCase() : "DRAFT";

        // Prevent overlapping active contracts
        if ("RUNNING".equalsIgnoreCase(status)) {
            Optional<Contract> existingRunning = contractRepository.findFirstByEmployeeIdAndStatus(employee.getId(), "RUNNING");
            if (existingRunning.isPresent()) {
                throw new ConflictException("Employee already has an active RUNNING contract: " + existingRunning.get().getId());
            }
        }

        SalaryStructure salaryStructure = null;
        if (request.getSalaryStructureId() != null) {
            salaryStructure = salaryStructureRepository.findById(request.getSalaryStructureId())
                    .orElseThrow(() -> new ResourceNotFoundException("SalaryStructure not found: " + request.getSalaryStructureId()));
        }

        WorkingSchedule workingSchedule = null;
        if (request.getWorkingScheduleId() != null) {
            workingSchedule = workingScheduleRepository.findById(request.getWorkingScheduleId())
                    .orElseThrow(() -> new ResourceNotFoundException("WorkingSchedule not found: " + request.getWorkingScheduleId()));
        }

        Contract contract = Contract.builder()
                .employee(employee)
                .contractType(request.getContractType() != null ? request.getContractType() : "PERMANENT")
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .salary(request.getSalary())
                .salaryStructure(salaryStructure)
                .workingSchedule(workingSchedule)
                .status(status)
                .build();

        Contract saved = contractRepository.save(contract);
        log.info("Created contract (id={}) for employee id: {}", saved.getId(), employee.getId());
        return ContractResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> getMyContracts() {
        UUID employeeId = currentEmployeeService.getCurrentEmployeeId();
        return getContractsByEmployeeId(employeeId);
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> getContractsByEmployeeId(UUID employeeId) {
        return contractRepository.findByEmployeeIdOrderByStartDateDesc(employeeId).stream()
                .map(ContractResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ContractResponse getContractById(UUID id) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + id));
        return ContractResponse.fromEntity(contract);
    }

    @Transactional
    public ContractResponse updateContractStatus(UUID id, String newStatus) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + id));

        String upperStatus = newStatus.trim().toUpperCase();
        if ("RUNNING".equalsIgnoreCase(upperStatus)) {
            Optional<Contract> existing = contractRepository.findFirstByEmployeeIdAndStatus(contract.getEmployee().getId(), "RUNNING");
            if (existing.isPresent() && !existing.get().getId().equals(id)) {
                throw new ConflictException("Another running contract already exists for this employee.");
            }
        }

        contract.setStatus(upperStatus);
        Contract updated = contractRepository.save(contract);
        return ContractResponse.fromEntity(updated);
    }
}
