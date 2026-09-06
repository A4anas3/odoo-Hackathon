package com.odoo.hr.user.config;

import com.odoo.hr.employee.model.Employee;
import com.odoo.hr.employee.repository.EmployeeRepository;
import com.odoo.hr.user.model.Role;
import com.odoo.hr.user.model.User;
import com.odoo.hr.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Component
@Order(20) // Runs after DataInitializer (10) and before IndianUsersDataSeeder (30)
@RequiredArgsConstructor
public class AdminUserInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    private record SeedAccount(
        String email,
        String firstName,
        String lastName,
        Role role
    ) {}

    @Override
    @Transactional
    public void run(String... args) {
        seedStandardAccounts();
        linkExistingUnlinkedEmployees();
    }

    private void seedStandardAccounts() {
        List<SeedAccount> seeds = List.of(
            new SeedAccount("admin@company.com", "Sarah", "Connor", Role.ADMIN),
            new SeedAccount("hrmanager@company.com", "Michael", "Scott", Role.HR_MANAGER),
            new SeedAccount("payrolladmin@company.com", "Nisha", "Rao", Role.HR_PAYROLL_ADMIN),
            new SeedAccount("payrolluser@company.com", "Aarav", "Mehta", Role.HR_PAYROLL_USER),
            new SeedAccount("employee@company.com", "Dwight", "Schrute", Role.EMPLOYEE),
            new SeedAccount("pam@company.com", "Pam", "Beesly", Role.HR_PAYROLL_USER),
            new SeedAccount("manager@odoo.com", "Rachel", "Green", Role.HR_PAYROLL_ADMIN),
            new SeedAccount("admin@odoo.com", "Arthur", "Dent", Role.ADMIN)
        );

        for (SeedAccount seed : seeds) {
            String email = seed.email();
            if (userRepository.findByEmailIgnoreCase(email).isEmpty()) {
                Employee employee = employeeRepository.findByEmail(email).orElse(null);

                User user = User.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode("Passw0rd123"))
                    .employee(employee)
                    
                    .roles(new HashSet<>(Set.of(seed.role())))
                    .status("ACTIVE")
                    .build();

                userRepository.save(user);
                log.info("Seeded backend user account: email={}, role={}, employee={}",
                    email, seed.role(), employee != null ? employee.getFullName() : "None");
            }
        }
    }

    private void linkExistingUnlinkedEmployees() {
        for (Employee emp : employeeRepository.findAll()) {
            if (emp.getEmail() != null && !emp.getEmail().isBlank()) {
                if (userRepository.findByEmailIgnoreCase(emp.getEmail()).isEmpty() &&
                    userRepository.findByEmployeeId(emp.getId()).isEmpty()) {

                    Role assignedRole = Role.EMPLOYEE;
                    String emailLower = emp.getEmail().toLowerCase();
                    if (emailLower.contains("admin")) {
                        assignedRole = Role.ADMIN;
                    } else if (emailLower.contains("manager") || emailLower.contains("hr")) {
                        assignedRole = Role.HR_MANAGER;
                    } else if (emailLower.contains("payroll") && emailLower.contains("admin")) {
                        assignedRole = Role.HR_PAYROLL_ADMIN;
                    } else if (emailLower.contains("payroll")) {
                        assignedRole = Role.HR_PAYROLL_USER;
                    }

                    User user = User.builder()
                        .email(emp.getEmail().trim().toLowerCase())
                        .passwordHash(passwordEncoder.encode("Passw0rd123"))
                        .employee(emp)
                        .roles(new HashSet<>(Set.of(assignedRole)))
                        .status("ACTIVE")
                        .build();

                    userRepository.save(user);
                    log.info("Auto-linked employee {} ({}) to user account with role {}",
                        emp.getFullName(), emp.getEmail(), assignedRole);
                }
            }
        }
    }
}
