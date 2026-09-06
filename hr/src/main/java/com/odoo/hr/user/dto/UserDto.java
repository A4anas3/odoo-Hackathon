package com.odoo.hr.user.dto;

import com.odoo.hr.user.model.Role;
import com.odoo.hr.user.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private UUID id;
    private String email;
    private String username;
    private String status;
    private Set<Role> roles;
    private List<String> authorities;
    private Role primaryRole;
    private LinkedEmployeeDto employee;
    private OffsetDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LinkedEmployeeDto {
        private UUID id;
        private String employeeCode;
        private String firstName;
        private String lastName;
        private String fullName;
        private String email;
        private String departmentName;
        private String jobTitle;
    }

    public static UserDto fromEntity(User user) {
        if (user == null) return null;

        LinkedEmployeeDto empDto = null;
        String resolvedName = user.getEmail().split("@")[0];

        if (user.getEmployee() != null) {
            var emp = user.getEmployee();
            resolvedName = emp.getFullName().trim().isEmpty() ? resolvedName : emp.getFullName();
            empDto = LinkedEmployeeDto.builder()
                .id(emp.getId())
                .employeeCode(emp.getEmployeeCode())
                .firstName(emp.getFirstName())
                .lastName(emp.getLastName())
                .fullName(emp.getFullName())
                .email(emp.getEmail())
                .departmentName(emp.getDepartment() != null ? emp.getDepartment().getName() : null)
                .jobTitle(emp.getJobPosition() != null ? emp.getJobPosition().getTitle() : null)
                .build();
        }

        List<String> authorities = user.getRoles() != null
            ? user.getRoles().stream().map(Role::getAuthority).collect(Collectors.toList())
            : List.of("ROLE_EMPLOYEE");

        Role primaryRole = Role.EMPLOYEE;
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            if (user.getRoles().contains(Role.ADMIN)) {
                primaryRole = Role.ADMIN;
            } else if (user.getRoles().contains(Role.HR_MANAGER)) {
                primaryRole = Role.HR_MANAGER;
            } else if (user.getRoles().contains(Role.HR_PAYROLL_ADMIN)) {
                primaryRole = Role.HR_PAYROLL_ADMIN;
            } else if (user.getRoles().contains(Role.HR_PAYROLL_USER)) {
                primaryRole = Role.HR_PAYROLL_USER;
            } else {
                primaryRole = user.getRoles().iterator().next();
            }
        }

        return UserDto.builder()
            .id(user.getId())
            .email(user.getEmail())
            .username(resolvedName)
            .status(user.getStatus())
            .roles(user.getRoles())
            .authorities(authorities)
            .primaryRole(primaryRole)
            .employee(empDto)
            .createdAt(user.getCreatedAt())
            .build();
    }
}
