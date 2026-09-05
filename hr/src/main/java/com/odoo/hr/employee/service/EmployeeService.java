package com.odoo.hr.employee.service;

import com.odoo.hr.common.exception.ConflictException;
import com.odoo.hr.common.exception.ResourceNotFoundException;
import com.odoo.hr.contract.repository.ContractRepository;
import com.odoo.hr.employee.dto.CreateEmployeeRequest;
import com.odoo.hr.employee.dto.EmployeeResponse;
import com.odoo.hr.employee.dto.UpdateEmployeeRequest;
import com.odoo.hr.employee.model.Employee;
import com.odoo.hr.employee.repository.EmployeeRepository;
import com.odoo.hr.organization.model.Department;
import com.odoo.hr.organization.model.JobPosition;
import com.odoo.hr.organization.repository.DepartmentRepository;
import com.odoo.hr.organization.repository.JobPositionRepository;
import com.odoo.hr.security.CurrentEmployeeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final JobPositionRepository jobPositionRepository;
    private final CurrentEmployeeService currentEmployeeService;
    private final ContractRepository contractRepository;

    @Transactional
    public EmployeeResponse registerCurrentEmployee(CreateEmployeeRequest request) {
        String authProviderUserId = currentEmployeeService.getAuthenticatedAuthProviderUserId();
        return createEmployeeWithAuthProviderUserId(request, authProviderUserId);
    }

    @Transactional
    public EmployeeResponse createEmployee(CreateEmployeeRequest request) {
        Employee currentEmployee = currentEmployeeService.getCurrentEmployee();
        if (currentEmployee.getStatus() == null || !"ACTIVE".equalsIgnoreCase(currentEmployee.getStatus())) {
            throw new ConflictException("Terminated or inactive employees cannot create employee profiles.");
        }

        String authProviderUserId = request.getAuthProviderUserId();
        if (authProviderUserId == null || authProviderUserId.isBlank()) {
            authProviderUserId = "unlinked-" + java.util.UUID.randomUUID();
        }
        return createEmployeeWithAuthProviderUserId(request, authProviderUserId);
    }

    private EmployeeResponse createEmployeeWithAuthProviderUserId(CreateEmployeeRequest request, String authProviderUserId) {
        if (employeeRepository.existsByAuthProviderUserId(authProviderUserId)) {
            throw new ConflictException("An employee with auth provider user ID '" + authProviderUserId + "' already exists.");
        }
        if (employeeRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("An employee with email '" + request.getEmail() + "' already exists.");
        }
        if (request.getEmployeeCode() != null && employeeRepository.existsByEmployeeCode(request.getEmployeeCode())) {
            throw new ConflictException("An employee with code '" + request.getEmployeeCode() + "' already exists.");
        }

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + request.getDepartmentId()));
        }

        JobPosition jobPosition = null;
        if (request.getJobPositionId() != null) {
            jobPosition = jobPositionRepository.findById(request.getJobPositionId())
                    .orElseThrow(() -> new ResourceNotFoundException("JobPosition not found: " + request.getJobPositionId()));
        }

        Employee manager = null;
        if (request.getManagerId() != null) {
            manager = employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager employee not found: " + request.getManagerId()));
        }

        String employeeCode = request.getEmployeeCode();
        if (employeeCode == null || employeeCode.isBlank()) {
            long count = employeeRepository.count() + 1;
            employeeCode = String.format("EMP-%03d", count);
        }

        Employee employee = Employee.builder()
                .authProviderUserId(authProviderUserId)
                .employeeCode(employeeCode)
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .phone(request.getPhone())
                .dateOfBirth(request.getDateOfBirth())
                .address(request.getAddress())
                .department(department)
                .jobPosition(jobPosition)
                .manager(manager)
                .joiningDate(request.getJoiningDate())
                .employeeType(request.getEmployeeType() != null ? request.getEmployeeType() : "FULL_TIME")
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .bankAccountNo(request.getBankAccountNo())
                .bankName(request.getBankName())
                .ifscCode(request.getIfscCode())
                .emergencyContactName(request.getEmergencyContactName())
                .emergencyContactPhone(request.getEmergencyContactPhone())
                .build();

        Employee saved = employeeRepository.save(employee);
        log.info("Created new employee with id: {} mapped to authProviderUserId: {}", saved.getId(), authProviderUserId);
        return EmployeeResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getCurrentEmployeeProfile() {
        Employee currentEmployee = currentEmployeeService.getCurrentEmployee();
        return EmployeeResponse.fromEntity(currentEmployee);
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeById(UUID id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        return EmployeeResponse.fromEntity(employee);
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeByAuthProviderUserId(String authProviderUserId) {
        Employee employee = employeeRepository.findByAuthProviderUserId(authProviderUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with authProviderUserId: " + authProviderUserId));
        return EmployeeResponse.fromEntity(employee);
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllEmployees() {
        return employeeRepository.findAll().stream()
                .map(EmployeeResponse::fromEntity)
                .toList();
    }

    @Transactional
    public EmployeeResponse updateEmployee(UUID id, UpdateEmployeeRequest request) {
        Employee currentEmployee = currentEmployeeService.getCurrentEmployee();
        if (currentEmployee.getStatus() == null || !"ACTIVE".equalsIgnoreCase(currentEmployee.getStatus())) {
            throw new ConflictException("Terminated or inactive employees cannot modify employee records.");
        }

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        if (request.getFirstName() != null) employee.setFirstName(request.getFirstName().trim());
        if (request.getLastName() != null) employee.setLastName(request.getLastName().trim());
        if (request.getPhone() != null) employee.setPhone(request.getPhone());
        if (request.getDateOfBirth() != null) employee.setDateOfBirth(request.getDateOfBirth());
        if (request.getAddress() != null) employee.setAddress(request.getAddress());

        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + request.getDepartmentId()));
            employee.setDepartment(department);
        }

        if (request.getJobPositionId() != null) {
            JobPosition jobPosition = jobPositionRepository.findById(request.getJobPositionId())
                    .orElseThrow(() -> new ResourceNotFoundException("JobPosition not found: " + request.getJobPositionId()));
            employee.setJobPosition(jobPosition);
        }

        if (request.getManagerId() != null) {
            Employee manager = employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found: " + request.getManagerId()));
            employee.setManager(manager);
        }

        if (request.getJoiningDate() != null) employee.setJoiningDate(request.getJoiningDate());
        if (request.getEmployeeType() != null) employee.setEmployeeType(request.getEmployeeType());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            String newStatus = request.getStatus().trim().toUpperCase();
            employee.setStatus(newStatus);
            if ("TERMINATED".equals(newStatus) || "INACTIVE".equals(newStatus)) {
                contractRepository.findByEmployeeId(employee.getId()).stream()
                        .filter(c -> "RUNNING".equalsIgnoreCase(c.getStatus()))
                        .forEach(c -> {
                            c.setStatus("CANCELLED");
                            c.setEndDate(LocalDate.now());
                            contractRepository.save(c);
                            log.info("Auto-cancelled contract id={} for deactivated/terminated employee id={}", c.getId(), employee.getId());
                        });
                syncAuthAccountStatus(employee.getEmail(), false, true);
            } else if ("ACTIVE".equals(newStatus)) {
                syncAuthAccountStatus(employee.getEmail(), true, false);
            }
        }
        if (request.getBankAccountNo() != null) employee.setBankAccountNo(request.getBankAccountNo());
        if (request.getBankName() != null) employee.setBankName(request.getBankName());
        if (request.getIfscCode() != null) employee.setIfscCode(request.getIfscCode());
        if (request.getEmergencyContactName() != null) employee.setEmergencyContactName(request.getEmergencyContactName());
        if (request.getEmergencyContactPhone() != null) employee.setEmergencyContactPhone(request.getEmergencyContactPhone());

        Employee updated = employeeRepository.save(employee);
        return EmployeeResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteEmployee(UUID id) {
        Employee currentEmployee = currentEmployeeService.getCurrentEmployee();
        if (currentEmployee.getStatus() == null || !"ACTIVE".equalsIgnoreCase(currentEmployee.getStatus())) {
            throw new ConflictException("Terminated or inactive employees cannot delete employee profiles.");
        }

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        syncAuthAccountStatus(employee.getEmail(), false, true);
        employeeRepository.deleteById(id);
    }

    private void syncAuthAccountStatus(String email, boolean enabled, boolean accountLocked) {
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            String uri = String.format("http://localhost:8085/internal/users/status?email=%s&enabled=%b&accountLocked=%b",
                    java.net.URLEncoder.encode(email, java.nio.charset.StandardCharsets.UTF_8), enabled, accountLocked);
            java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(uri))
                    .method("PATCH", java.net.http.HttpRequest.BodyPublishers.noBody())
                    .timeout(java.time.Duration.ofSeconds(3))
                    .build();
            client.sendAsync(req, java.net.http.HttpResponse.BodyHandlers.discarding());
            log.info("Synced auth-service account status for {}: enabled={}, locked={}", email, enabled, accountLocked);
        } catch (Exception e) {
            log.warn("Could not sync auth-service status for {}: {}", email, e.getMessage());
        }
    }
}
