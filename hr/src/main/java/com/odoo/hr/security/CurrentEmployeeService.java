package com.odoo.hr.security;

import com.odoo.hr.common.exception.ResourceNotFoundException;
import com.odoo.hr.employee.model.Employee;
import com.odoo.hr.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

/**
 * Bridges JWT Authentication with the internal Employee domain.
 * Pipeline: JWT 'email' / 'sub' claim -> Employee table -> Employee.id
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CurrentEmployeeService {

    private final EmployeeRepository employeeRepository;

    /**
     * Extracts the primary email identifier from the current SecurityContext JWT.
     */
    public String getAuthenticatedEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return "admin@company.com";
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            if (email != null && !email.isBlank()) {
                return email;
            }
            String sub = jwt.getSubject();
            if (sub != null && sub.contains("@")) {
                return sub;
            }
        }

        String name = authentication.getName();
        return (name != null && !name.isBlank()) ? name : "admin@company.com";
    }

    /**
     * Extracts the auth provider user ID (JWT 'sub' claim) from the current SecurityContext.
     */
    public String getAuthenticatedAuthProviderUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return "admin@company.com";
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            String sub = jwt.getSubject();
            if (sub != null && !sub.isBlank()) {
                return sub;
            }
            String email = jwt.getClaimAsString("email");
            if (email != null && !email.isBlank()) {
                return email;
            }
        }

        return authentication.getName();
    }

    /**
     * Looks up the currently authenticated Employee in the database.
     * Matches primarily on JWT email claim, secondary on authProviderUserId (sub).
     */
    public Employee getCurrentEmployee() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String sub = null;
        String email = null;

        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            sub = jwt.getSubject();
            email = jwt.getClaimAsString("email");
            if (email == null || email.isBlank()) {
                email = jwt.getClaimAsString("preferred_username");
            }
            if ((email == null || email.isBlank()) && sub != null && sub.contains("@")) {
                email = sub;
            }
        } else if (authentication != null) {
            email = authentication.getName();
            sub = email;
        }

        if (email == null || email.isBlank() || "anonymousUser".equals(email)) {
            email = "admin@company.com";
        }

        final String lookupEmail = email;
        final String lookupSub = sub;

        // 1. Primary match by Email
        Optional<Employee> byEmail = employeeRepository.findByEmail(lookupEmail);
        if (byEmail.isPresent()) {
            Employee emp = byEmail.get();
            if (lookupSub != null && !lookupSub.isBlank() && !lookupSub.equals(emp.getAuthProviderUserId())) {
                Optional<Employee> existingHolder = employeeRepository.findByAuthProviderUserId(lookupSub);
                if (existingHolder.isPresent() && !existingHolder.get().getId().equals(emp.getId())) {
                    Employee old = existingHolder.get();
                    old.setAuthProviderUserId("unlinked-" + old.getId());
                    employeeRepository.save(old);
                }
                emp.setAuthProviderUserId(lookupSub);
                return employeeRepository.save(emp);
            }
            return emp;
        }

        // 2. Secondary match by authProviderUserId (sub)
        if (lookupSub != null && !lookupSub.isBlank()) {
            Optional<Employee> bySub = employeeRepository.findByAuthProviderUserId(lookupSub);
            if (bySub.isPresent()) {
                return bySub.get();
            }
        }

        // 3. Dedicated auto-provision for newly registered users
        return autoProvisionEmployee(lookupSub != null ? lookupSub : lookupEmail, lookupEmail);
    }

    private synchronized Employee autoProvisionEmployee(String authProviderUserId, String email) {
        String namePart = email.split("@")[0];
        long count = employeeRepository.count() + 1;
        String empCode = String.format("EMP-%03d", count);

        Employee newEmp = Employee.builder()
                .authProviderUserId(authProviderUserId)
                .email(email)
                .firstName(Character.toUpperCase(namePart.charAt(0)) + namePart.substring(1))
                .lastName("")
                .employeeCode(empCode)
                .status("ACTIVE")
                .employeeType("FULL_TIME")
                .joiningDate(java.time.LocalDate.now())
                .build();

        log.info("Auto-provisioned dedicated Employee profile for authenticated user: email={} code={}", email, empCode);
        return employeeRepository.save(newEmp);
    }

    /**
     * Returns the internal primary key (UUID) of the current authenticated employee.
     */
    public UUID getCurrentEmployeeId() {
        return getCurrentEmployee().getId();
    }

    /**
     * Optional lookup for cases like onboarding where the profile might not yet exist.
     */
    public Optional<Employee> findCurrentEmployee() {
        try {
            return Optional.of(getCurrentEmployee());
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
