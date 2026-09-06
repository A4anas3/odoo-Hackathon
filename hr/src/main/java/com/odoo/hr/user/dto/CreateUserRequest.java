package com.odoo.hr.user.dto;

import com.odoo.hr.user.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {

    private UUID employeeId;

    @NotBlank(message = "Work email is required")
    @Email(message = "Invalid work email format")
    private String email;

    private String password;

    private Set<Role> roles;

    // Single role support if sent as single string or radio value
    private Role role;

    @Builder.Default
    private String status = "ACTIVE";
}
