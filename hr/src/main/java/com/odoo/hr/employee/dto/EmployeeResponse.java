package com.odoo.hr.employee.dto;

import com.odoo.hr.employee.model.Employee;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeResponse {
    private UUID id;
    private String authProviderUserId;
    private String employeeCode;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String address;
    private UUID departmentId;
    private String departmentName;
    private UUID jobPositionId;
    private String jobPositionTitle;
    private UUID managerId;
    private String managerName;
    private UUID workingScheduleId;
    private String workingScheduleName;
    private LocalDate joiningDate;
    private String employeeType;
    private String status;
    private String bankAccountNo;
    private String bankName;
    private String ifscCode;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private Long version;
    private String role;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static EmployeeResponse fromEntity(Employee emp) {
        if (emp == null) return null;
        return EmployeeResponse.builder()
                .id(emp.getId())
                .authProviderUserId(emp.getAuthProviderUserId())
                .employeeCode(emp.getEmployeeCode())
                .firstName(emp.getFirstName())
                .lastName(emp.getLastName())
                .fullName(emp.getFullName())
                .email(emp.getEmail())
                .phone(emp.getPhone())
                .dateOfBirth(emp.getDateOfBirth())
                .address(emp.getAddress())
                .departmentId(emp.getDepartment() != null ? emp.getDepartment().getId() : null)
                .departmentName(emp.getDepartment() != null ? emp.getDepartment().getName() : null)
                .jobPositionId(emp.getJobPosition() != null ? emp.getJobPosition().getId() : null)
                .jobPositionTitle(emp.getJobPosition() != null ? emp.getJobPosition().getTitle() : null)
                .managerId(emp.getManager() != null ? emp.getManager().getId() : null)
                .managerName(emp.getManager() != null ? emp.getManager().getFullName() : null)
                .workingScheduleId(emp.getWorkingSchedule() != null ? emp.getWorkingSchedule().getId() : null)
                .workingScheduleName(emp.getWorkingSchedule() != null ? emp.getWorkingSchedule().getName() : null)
                .joiningDate(emp.getJoiningDate())
                .employeeType(emp.getEmployeeType())
                .status(emp.getStatus())
                .bankAccountNo(emp.getBankAccountNo())
                .bankName(emp.getBankName())
                .ifscCode(emp.getIfscCode())
                .emergencyContactName(emp.getEmergencyContactName())
                .emergencyContactPhone(emp.getEmergencyContactPhone())
                .version(emp.getVersion())
                .createdAt(emp.getCreatedAt())
                .updatedAt(emp.getUpdatedAt())
                .build();
    }
}
