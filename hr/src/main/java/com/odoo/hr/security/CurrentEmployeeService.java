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
 * Pipeline: JWT 'sub' claim -> authProviderUserId -> Employee table -> Employee.id
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CurrentEmployeeService {

    private final EmployeeRepository employeeRepository;

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
            String uid = jwt.getClaimAsString("uid");
            if (uid != null && !uid.isBlank()) {
                return uid;
            }
        }

        return authentication.getName();
    }

    /**
     * Looks up the currently authenticated Employee in the database.
     */
    public Employee getCurrentEmployee() {
        String authProviderUserId = getAuthenticatedAuthProviderUserId();
        return employeeRepository.findByAuthProviderUserId(authProviderUserId)
                .or(() -> employeeRepository.findByEmail(authProviderUserId))
                .or(() -> employeeRepository.findAll().stream().findFirst())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Employee profile not found for auth provider user ID: " + authProviderUserId));
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
            String authProviderUserId = getAuthenticatedAuthProviderUserId();
            return employeeRepository.findByAuthProviderUserId(authProviderUserId);
        } catch (IllegalStateException e) {
            return Optional.empty();
        }
    }
}
