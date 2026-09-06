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
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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
    private final com.odoo.hr.user.repository.UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final EmployeeRedisCacheService employeeRedisCacheService;

    @Transactional
    @CacheEvict(value = "employees", allEntries = true)
    public EmployeeResponse registerCurrentEmployee(CreateEmployeeRequest request) {
        String authProviderUserId = currentEmployeeService.getAuthenticatedAuthProviderUserId();
        return createEmployeeWithAuthProviderUserId(request, authProviderUserId);
    }

    @Transactional
    @CacheEvict(value = "employees", allEntries = true)
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

        // Auto-provision user login account with password provided during employee creation
        String cleanEmail = saved.getEmail().trim().toLowerCase();
        if (userRepository.findByEmailIgnoreCase(cleanEmail).isEmpty()) {
            String rawPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword()
                : "Passw0rd123";
            com.odoo.hr.user.model.Role role = com.odoo.hr.user.model.Role.fromString(request.getRole());
            java.util.Set<com.odoo.hr.user.model.Role> rolesSet = new java.util.HashSet<>();
            rolesSet.add(role);
            com.odoo.hr.user.model.User user = com.odoo.hr.user.model.User.builder()
                .email(cleanEmail)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .employee(saved)
                .roles(rolesSet)
                .status("ACTIVE")
                .build();
            userRepository.save(user);
            log.info("Auto-provisioned login User account for employee {} with role {}", cleanEmail, role);
        }

        // Revoke all employee Redis cache keys so new employee appears immediately
        employeeRedisCacheService.revokeAll();

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
        EmployeeResponse resp = EmployeeResponse.fromEntity(employee);
        userRepository.findByEmployeeId(id).ifPresent(u -> {
            if (u.getRoles() != null && !u.getRoles().isEmpty()) {
                resp.setRole(u.getRoles().iterator().next().name());
            }
        });
        return resp;
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeByAuthProviderUserId(String authProviderUserId) {
        Employee employee = employeeRepository.findByAuthProviderUserId(authProviderUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with authProviderUserId: " + authProviderUserId));
        EmployeeResponse resp = EmployeeResponse.fromEntity(employee);
        userRepository.findByEmployeeId(employee.getId()).ifPresent(u -> {
            if (u.getRoles() != null && !u.getRoles().isEmpty()) {
                resp.setRole(u.getRoles().iterator().next().name());
            }
        });
        return resp;
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllEmployees() {
        List<Employee> employees = employeeRepository.findAll(
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        List<UUID> employeeIds = employees.stream().map(Employee::getId).toList();
        java.util.Map<UUID, String> roleByEmpId = new java.util.HashMap<>();
        if (!employeeIds.isEmpty()) {
            List<com.odoo.hr.user.model.User> users = userRepository.findByEmployeeIdIn(employeeIds);
            for (com.odoo.hr.user.model.User u : users) {
                if (u.getEmployee() != null && u.getRoles() != null && !u.getRoles().isEmpty()) {
                    roleByEmpId.put(u.getEmployee().getId(), u.getRoles().iterator().next().name());
                }
            }
        }
        return employees.stream()
                .map(emp -> {
                    EmployeeResponse resp = EmployeeResponse.fromEntity(emp);
                    if (roleByEmpId.containsKey(emp.getId())) {
                        resp.setRole(roleByEmpId.get(emp.getId()));
                    }
                    return resp;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public com.odoo.hr.common.dto.PagedResponse<EmployeeResponse> getEmployeesPaged(
            String search, String department, String status, String type, org.springframework.data.domain.Pageable pageable) {

        // Default sort: recent at top show (createdAt DESC)
        if (pageable.getSort().isUnsorted()) {
            pageable = org.springframework.data.domain.PageRequest.of(
                    pageable.getPageNumber(),
                    pageable.getPageSize(),
                    org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        }

        String sortStr = pageable.getSort().toString();

        // 1. Check Redis Cache first
        com.odoo.hr.common.dto.PagedResponse<EmployeeResponse> cached = employeeRedisCacheService.getCachedPage(
                pageable.getPageNumber(), pageable.getPageSize(), sortStr, search, department, status, type);
        if (cached != null) {
            return cached;
        }

        // 2. Query Database
        boolean hasFilters = (search != null && !search.isBlank())
                || (department != null && !department.isBlank() && !"ALL".equalsIgnoreCase(department))
                || (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status))
                || (type != null && !type.isBlank() && !"ALL".equalsIgnoreCase(type));

        org.springframework.data.domain.Page<Employee> pageResult;
        if (hasFilters) {
            pageResult = employeeRepository.findWithFilters(search, department, status, type, pageable);
        } else {
            pageResult = employeeRepository.findAll(pageable);
        }

        // 3. Batch fetch user roles
        List<UUID> employeeIds = pageResult.getContent().stream().map(Employee::getId).toList();
        java.util.Map<UUID, String> roleByEmpId = new java.util.HashMap<>();
        if (!employeeIds.isEmpty()) {
            List<com.odoo.hr.user.model.User> users = userRepository.findByEmployeeIdIn(employeeIds);
            for (com.odoo.hr.user.model.User u : users) {
                if (u.getEmployee() != null && u.getRoles() != null && !u.getRoles().isEmpty()) {
                    roleByEmpId.put(u.getEmployee().getId(), u.getRoles().iterator().next().name());
                }
            }
        }

        // 4. Map to DTOs
        List<EmployeeResponse> responses = pageResult.getContent().stream()
                .map(emp -> {
                    EmployeeResponse resp = EmployeeResponse.fromEntity(emp);
                    if (roleByEmpId.containsKey(emp.getId())) {
                        resp.setRole(roleByEmpId.get(emp.getId()));
                    }
                    return resp;
                })
                .toList();

        com.odoo.hr.common.dto.PagedResponse<EmployeeResponse> pagedResponse = com.odoo.hr.common.dto.PagedResponse.<EmployeeResponse>builder()
                .content(responses)
                .page(pageResult.getNumber())
                .size(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .first(pageResult.isFirst())
                .last(pageResult.isLast())
                .build();

        // 5. Save to Redis Cache with TTL
        employeeRedisCacheService.putCachedPage(
                pageable.getPageNumber(), pageable.getPageSize(), sortStr, search, department, status, type, pagedResponse);

        return pagedResponse;
    }

    @Transactional
    @CacheEvict(value = "employees", allEntries = true)
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

        // Role change and password update for user account
        if (request.getRole() != null && !request.getRole().isBlank()) {
            com.odoo.hr.user.model.Role newRole = com.odoo.hr.user.model.Role.fromString(request.getRole());
            userRepository.findByEmployeeId(employee.getId()).ifPresentOrElse(
                u -> {
                    u.setRoles(new java.util.HashSet<>(java.util.Collections.singleton(newRole)));
                    if (request.getPassword() != null && !request.getPassword().isBlank()) {
                        u.setPasswordHash(passwordEncoder.encode(request.getPassword()));
                    }
                    userRepository.save(u);
                    log.info("Updated user account role for employee id={} to {}", employee.getId(), newRole);
                },
                () -> {
                    String pwd = (request.getPassword() != null && !request.getPassword().isBlank()) ? request.getPassword() : "Passw0rd123";
                    java.util.Set<com.odoo.hr.user.model.Role> rolesSet = new java.util.HashSet<>();
                    rolesSet.add(newRole);
                    com.odoo.hr.user.model.User newUser = com.odoo.hr.user.model.User.builder()
                        .email(employee.getEmail().trim().toLowerCase())
                        .passwordHash(passwordEncoder.encode(pwd))
                        .employee(employee)
                        .roles(rolesSet)
                        .status("ACTIVE")
                        .build();
                    userRepository.save(newUser);
                    log.info("Created user account for employee id={} with role {}", employee.getId(), newRole);
                }
            );
        } else if (request.getPassword() != null && !request.getPassword().isBlank()) {
            userRepository.findByEmployeeId(employee.getId()).ifPresent(u -> {
                u.setPasswordHash(passwordEncoder.encode(request.getPassword()));
                userRepository.save(u);
                log.info("Updated password for employee id={}", employee.getId());
            });
        }

        Employee updated = employeeRepository.save(employee);
        employeeRedisCacheService.revokeAll();

        EmployeeResponse resp = EmployeeResponse.fromEntity(updated);
        userRepository.findByEmployeeId(updated.getId()).ifPresent(u -> {
            if (u.getRoles() != null && !u.getRoles().isEmpty()) {
                resp.setRole(u.getRoles().iterator().next().name());
            }
        });
        return resp;
    }

    @Transactional
    @CacheEvict(value = "employees", allEntries = true)
    public void deleteEmployee(UUID id) {
        Employee currentEmployee = currentEmployeeService.getCurrentEmployee();
        if (currentEmployee.getStatus() == null || !"ACTIVE".equalsIgnoreCase(currentEmployee.getStatus())) {
            throw new ConflictException("Terminated or inactive employees cannot delete employee profiles.");
        }

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        syncAuthAccountStatus(employee.getEmail(), false);
        employeeRepository.deleteById(id);
        employeeRedisCacheService.revokeAll();
    }

    private void syncAuthAccountStatus(String email, boolean enabled) {
        syncAuthAccountStatus(email, enabled, !enabled);
    }

    private void syncAuthAccountStatus(String email, boolean enabled, boolean accountLocked) {
        if (email != null && !email.isBlank()) {
            userRepository.findByEmailIgnoreCase(email).ifPresent(u -> {
                u.setStatus(enabled && !accountLocked ? "ACTIVE" : "INACTIVE");
                userRepository.save(u);
                log.info("Synced User status directly in DB for {}: status={}", email, u.getStatus());
            });
        }
    }
}
