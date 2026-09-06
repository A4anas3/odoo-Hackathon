package com.odoo.hr.employee.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateEmployeeRequest {

    private String authProviderUserId;

    private String employeeCode;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String phone;

    private LocalDate dateOfBirth;

    private String address;

    private UUID departmentId;

    private UUID jobPositionId;

    private UUID managerId;

    private LocalDate joiningDate;

    private String employeeType;

    private String status;

    private String bankAccountNo;

    private String bankName;

    private String ifscCode;

    private String emergencyContactName;

    private String emergencyContactPhone;

    private String password;

    private String role;
}
