package com.authservice.config;

import com.authservice.entity.Role;
import com.authservice.entity.User;
import com.authservice.repository.RoleRepository;
import com.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking baseline roles and demo users in auth-service...");

        // Ensure baseline roles exist
        Role adminRole = getOrCreateRole("ADMIN", "Full administrative access");
        Role managerRole = getOrCreateRole("MANAGER", "Elevated access for managing resources");
        Role userRole = getOrCreateRole("USER", "Standard authenticated user");

        // Seed default demo accounts with password "Passw0rd123"
        String defaultPassword = "Passw0rd123";

        createDemoUserIfMissing("admin@company.com", "admin", defaultPassword, Set.of(adminRole, userRole));
        createDemoUserIfMissing("hrmanager@company.com", "hrmanager", defaultPassword, Set.of(managerRole, userRole));
        createDemoUserIfMissing("employee@company.com", "employee", defaultPassword, Set.of(userRole));

        createDemoUserIfMissing("admin@odoo.com", "admin_odoo", defaultPassword, Set.of(adminRole, userRole));
        createDemoUserIfMissing("manager@odoo.com", "manager_odoo", defaultPassword, Set.of(managerRole, userRole));
        createDemoUserIfMissing("alice@example.com", "alice", defaultPassword, Set.of(userRole));
        createDemoUserIfMissing("pam@company.com", "pam", defaultPassword, Set.of(userRole));
        createDemoUserIfMissing("jim@company.com", "jim", defaultPassword, Set.of(userRole));
    }

    private Role getOrCreateRole(String name, String description) {
        return roleRepository.findByNameIgnoreCase(name).orElseGet(() -> {
            Role role = Role.builder()
                    .name(name.toUpperCase())
                    .description(description)
                    .build();
            return roleRepository.save(role);
        });
    }

    private void createDemoUserIfMissing(String email, String username, String rawPassword, Set<Role> roles) {
        if (!userRepository.existsByEmailIgnoreCase(email)) {
            User user = User.builder()
                    .email(email.toLowerCase())
                    .username(username.toLowerCase())
                    .passwordHash(passwordEncoder.encode(rawPassword))
                    .enabled(true)
                    .accountLocked(false)
                    .emailVerified(true)
                    .roles(roles)
                    .build();
            userRepository.save(user);
            log.info("Seeded demo user in auth-service: email={} roles={}", email, roles);
        }
    }
}
