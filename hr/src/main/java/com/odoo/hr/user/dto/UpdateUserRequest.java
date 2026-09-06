package com.odoo.hr.user.dto;

import com.odoo.hr.user.model.Role;
import jakarta.validation.constraints.Email;
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
public class UpdateUserRequest {

    private UUID employeeId;

    @Email(message = "Invalid work email format")
    private String email;

    private String password;

    private Set<Role> roles;

    private Role role;

    private String status;
}
