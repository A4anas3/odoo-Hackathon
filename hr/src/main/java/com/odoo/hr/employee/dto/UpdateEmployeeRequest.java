package com.odoo.hr.employee.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
public class UpdateEmployeeRequest {
    private String firstName;
    private String lastName;
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
    private String role;
    private String password;
}
