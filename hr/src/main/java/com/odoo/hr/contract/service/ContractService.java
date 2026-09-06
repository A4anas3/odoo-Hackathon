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
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
    @CacheEvict(value = "dashboard", allEntries = true)
    public ContractResponse createContract(ContractRequest request) {
        Employee currentEmployee = currentEmployeeService.getCurrentEmployee();
        if (currentEmployee.getStatus() == null || !"ACTIVE".equalsIgnoreCase(currentEmployee.getStatus())) {
            throw new ConflictException("Terminated or inactive employees cannot manage contracts.");
        }

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + request.getEmployeeId()));

        if (employee.getStatus() == null || !"ACTIVE".equalsIgnoreCase(employee.getStatus())) {
            throw new ConflictException("Cannot create a contract for a terminated or inactive employee.");
        }

        String status = request.getStatus() != null ? request.getStatus().trim().toUpperCase() : "DRAFT";

        // When activating a new RUNNING contract, auto-expire previous running contracts into history
        if ("RUNNING".equalsIgnoreCase(status) || "ACTIVE".equalsIgnoreCase(status)) {
            List<Contract> existingRunningList = contractRepository.findByEmployeeId(employee.getId()).stream()
                    .filter(c -> "RUNNING".equalsIgnoreCase(c.getStatus()) || "ACTIVE".equalsIgnoreCase(c.getStatus()))
                    .toList();
            for (Contract oldContract : existingRunningList) {
                oldContract.setStatus("EXPIRED");
                if (request.getStartDate() != null) {
                    LocalDate autoEnd = request.getStartDate().minusDays(1);
                    if (oldContract.getStartDate() != null && autoEnd.isBefore(oldContract.getStartDate())) {
                        autoEnd = oldContract.getStartDate();
                    }
                    if (oldContract.getEndDate() == null || oldContract.getEndDate().isAfter(autoEnd)) {
                        oldContract.setEndDate(autoEnd);
                    }
                } else if (oldContract.getEndDate() == null) {
                    oldContract.setEndDate(LocalDate.now().minusDays(1));
                }
                contractRepository.save(oldContract);
                log.info("Auto-expired previous contract (id={}) for employee id: {} to preserve contract history", 
                        oldContract.getId(), employee.getId());
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
                .wageType(request.getWageType() != null && !request.getWageType().isBlank() ? request.getWageType().trim().toUpperCase() : "MONTHLY")
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
    @CacheEvict(value = "dashboard", allEntries = true)
    public ContractResponse updateContractStatus(UUID id, String newStatus) {
        Employee currentEmployee = currentEmployeeService.getCurrentEmployee();
        if (currentEmployee.getStatus() == null || !"ACTIVE".equalsIgnoreCase(currentEmployee.getStatus())) {
            throw new ConflictException("Terminated or inactive employees cannot manage contracts.");
        }

        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + id));

        String upperStatus = newStatus.trim().toUpperCase();
        if ("RUNNING".equalsIgnoreCase(upperStatus) || "ACTIVE".equalsIgnoreCase(upperStatus)) {
            List<Contract> otherRunning = contractRepository.findByEmployeeId(contract.getEmployee().getId()).stream()
                    .filter(c -> !c.getId().equals(id) && ("RUNNING".equalsIgnoreCase(c.getStatus()) || "ACTIVE".equalsIgnoreCase(c.getStatus())))
                    .toList();
            for (Contract oldContract : otherRunning) {
                oldContract.setStatus("EXPIRED");
                if (contract.getStartDate() != null) {
                    LocalDate autoEnd = contract.getStartDate().minusDays(1);
                    if (oldContract.getStartDate() != null && autoEnd.isBefore(oldContract.getStartDate())) {
                        autoEnd = oldContract.getStartDate();
                    }
                    if (oldContract.getEndDate() == null || oldContract.getEndDate().isAfter(autoEnd)) {
                        oldContract.setEndDate(autoEnd);
                    }
                } else if (oldContract.getEndDate() == null) {
                    oldContract.setEndDate(LocalDate.now().minusDays(1));
                }
                contractRepository.save(oldContract);
                log.info("Auto-expired previous contract (id={}) for employee id: {} during status change to RUNNING", 
                        oldContract.getId(), contract.getEmployee().getId());
            }
        }

        contract.setStatus(upperStatus);
        Contract updated = contractRepository.save(contract);
        return ContractResponse.fromEntity(updated);
    }

    @Transactional
    @CacheEvict(value = "dashboard", allEntries = true)
    public ContractResponse updateContract(UUID id, ContractRequest request) {
        return updateContract(id, request, Boolean.TRUE.equals(request.getPreserveHistory()));
    }

    @Transactional
    @CacheEvict(value = "dashboard", allEntries = true)
    public ContractResponse updateContract(UUID id, ContractRequest request, boolean preserveHistory) {
        Employee currentEmployee = currentEmployeeService.getCurrentEmployee();
        if (currentEmployee.getStatus() == null || !"ACTIVE".equalsIgnoreCase(currentEmployee.getStatus())) {
            throw new ConflictException("Terminated or inactive employees cannot manage contracts.");
        }

        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + id));

        // When preserving history, archive existing contract as EXPIRED and create a new contract
        if (preserveHistory) {
            contract.setStatus("EXPIRED");
            if (request.getStartDate() != null) {
                LocalDate autoEnd = request.getStartDate().minusDays(1);
                if (contract.getStartDate() != null && autoEnd.isBefore(contract.getStartDate())) {
                    autoEnd = contract.getStartDate();
                }
                contract.setEndDate(autoEnd);
            } else if (contract.getEndDate() == null) {
                contract.setEndDate(LocalDate.now().minusDays(1));
            }
            contractRepository.save(contract);
            log.info("Archived existing contract {} as EXPIRED to preserve contract history for employee {}", 
                    contract.getId(), contract.getEmployee().getId());

            request.setEmployeeId(contract.getEmployee().getId());
            if (request.getStatus() == null || request.getStatus().isBlank()) {
                request.setStatus("RUNNING");
            }
            return createContract(request);
        }

        if (request.getContractType() != null) {
            contract.setContractType(request.getContractType());
        }
        if (request.getWageType() != null && !request.getWageType().isBlank()) {
            contract.setWageType(request.getWageType().trim().toUpperCase());
        }
        if (request.getStartDate() != null) {
            contract.setStartDate(request.getStartDate());
        }
        contract.setEndDate(request.getEndDate());
        if (request.getSalary() != null) {
            contract.setSalary(request.getSalary());
        }
        if (request.getSalaryStructureId() != null) {
            SalaryStructure salaryStructure = salaryStructureRepository.findById(request.getSalaryStructureId())
                    .orElseThrow(() -> new ResourceNotFoundException("SalaryStructure not found: " + request.getSalaryStructureId()));
            contract.setSalaryStructure(salaryStructure);
        } else {
            contract.setSalaryStructure(null);
        }
        if (request.getWorkingScheduleId() != null) {
            WorkingSchedule workingSchedule = workingScheduleRepository.findById(request.getWorkingScheduleId())
                    .orElseThrow(() -> new ResourceNotFoundException("WorkingSchedule not found: " + request.getWorkingScheduleId()));
            contract.setWorkingSchedule(workingSchedule);
        } else {
            contract.setWorkingSchedule(null);
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            contract.setStatus(request.getStatus().trim().toUpperCase());
        }

        Contract updated = contractRepository.save(contract);
        log.info("Updated contract (id={}) for employee id: {}", updated.getId(), updated.getEmployee().getId());
        return ContractResponse.fromEntity(updated);
    }

    public List<ContractResponse> getAllContracts(String status) {
        List<Contract> contracts;
        if (status != null && !status.isBlank()) {
            String upper = status.trim().toUpperCase();
            if ("ACTIVE".equals(upper)) {
                contracts = contractRepository.findByStatusIn(List.of("RUNNING", "ACTIVE"));
            } else {
                contracts = contractRepository.findByStatus(upper);
            }
        } else {
            contracts = contractRepository.findAll();
        }
        return contracts.stream()
                .map(ContractResponse::fromEntity)
                .toList();
    }
}
