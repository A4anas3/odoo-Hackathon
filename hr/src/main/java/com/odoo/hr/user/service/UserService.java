package com.odoo.hr.user.service;

import com.odoo.hr.common.exception.ConflictException;
import com.odoo.hr.common.exception.ResourceNotFoundException;
import com.odoo.hr.employee.model.Employee;
import com.odoo.hr.employee.repository.EmployeeRepository;
import com.odoo.hr.user.dto.CreateUserRequest;
import com.odoo.hr.user.dto.UpdateUserRequest;
import com.odoo.hr.user.dto.UserDto;
import com.odoo.hr.user.model.Role;
import com.odoo.hr.user.model.User;
import com.odoo.hr.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserDto> listUsers(String search, Role role, String status) {
        List<User> users = userRepository.searchUsers(
            (search != null && !search.isBlank()) ? search.trim() : null,
            role,
            (status != null && !status.isBlank()) ? status.trim() : null
        );
        return users.stream()
            .map(UserDto::fromEntity)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDto getById(UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            throw new ConflictException("User already exists with work email: " + cleanEmail);
        }

        Employee linkedEmployee = null;
        if (request.getEmployeeId() != null) {
            linkedEmployee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + request.getEmployeeId()));
            
            // Check if employee is already linked to another user account
            var existingUserWithEmp = userRepository.findByEmployeeId(request.getEmployeeId());
            if (existingUserWithEmp.isPresent()) {
                throw new ConflictException("Employee " + linkedEmployee.getFullName() + " is already linked to user " + existingUserWithEmp.get().getEmail());
            }
        }

        String rawPassword = (request.getPassword() != null && !request.getPassword().isBlank())
            ? request.getPassword()
            : "Passw0rd123";

        Set<Role> resolvedRoles = new HashSet<>();
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            resolvedRoles.addAll(request.getRoles());
        }
        if (request.getRole() != null) {
            resolvedRoles.add(request.getRole());
        }
        if (resolvedRoles.isEmpty()) {
            resolvedRoles.add(Role.EMPLOYEE);
        }

        String initialStatus = (request.getStatus() != null && !request.getStatus().isBlank())
            ? request.getStatus().toUpperCase()
            : "ACTIVE";

        User newUser = User.builder()
            .email(cleanEmail)
            .passwordHash(passwordEncoder.encode(rawPassword))
            .employee(linkedEmployee)
            .roles(resolvedRoles)
            .status(initialStatus)
            .build();

        User savedUser = userRepository.save(newUser);
        log.info("Created new user account: email={}, linkedEmployee={}, roles={}",
            savedUser.getEmail(),
            linkedEmployee != null ? linkedEmployee.getFullName() : "None",
            savedUser.getRoles());

        return UserDto.fromEntity(savedUser);
    }

    @Transactional
    public UserDto updateUser(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.existsByEmailIgnoreCase(newEmail)) {
                    throw new ConflictException("Work email is already in use by another user: " + newEmail);
                }
                user.setEmail(newEmail);
            }
        }

        if (request.getEmployeeId() != null) {
            if (user.getEmployee() == null || !request.getEmployeeId().equals(user.getEmployee().getId())) {
                Employee newEmp = employeeRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + request.getEmployeeId()));
                
                var existingUser = userRepository.findByEmployeeId(request.getEmployeeId());
                if (existingUser.isPresent() && !existingUser.get().getId().equals(user.getId())) {
                    throw new ConflictException("Employee is already linked to user: " + existingUser.get().getEmail());
                }
                user.setEmployee(newEmp);
            }
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        Set<Role> updatedRoles = new HashSet<>();
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            updatedRoles.addAll(request.getRoles());
        }
        if (request.getRole() != null) {
            updatedRoles.add(request.getRole());
        }
        if (!updatedRoles.isEmpty()) {
            user.setRoles(updatedRoles);
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            user.setStatus(request.getStatus().toUpperCase());
        }

        User updated = userRepository.save(user);
        log.info("Updated user account id={}: email={}, roles={}, status={}",
            updated.getId(), updated.getEmail(), updated.getRoles(), updated.getStatus());

        return UserDto.fromEntity(updated);
    }

    @Transactional
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userRepository.delete(user);
        log.info("Deleted user account id={}: email={}", user.getId(), user.getEmail());
    }
}
