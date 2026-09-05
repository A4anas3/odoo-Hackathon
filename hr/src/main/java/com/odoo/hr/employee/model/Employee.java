package com.odoo.hr.employee.model;

import com.odoo.hr.common.BaseEntity;
import com.odoo.hr.organization.model.Department;
import com.odoo.hr.organization.model.JobPosition;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "employees",
    indexes = {
        @Index(name = "idx_employees_auth_provider_uid", columnList = "auth_provider_user_id", unique = true),
        @Index(name = "idx_employees_employee_code", columnList = "employee_code", unique = true),
        @Index(name = "idx_employees_email", columnList = "email", unique = true),
        @Index(name = "idx_employees_department_id", columnList = "department_id"),
        @Index(name = "idx_employees_job_position_id", columnList = "job_position_id"),
        @Index(name = "idx_employees_status", columnList = "status")
    }
)
public class Employee extends BaseEntity {

    /**
     * Maps to the JWT 'sub' claim (External Auth Provider User ID).
     */
    @Column(name = "auth_provider_user_id", nullable = false, unique = true, length = 128)
    private String authProviderUserId;

    @Column(name = "employee_code", unique = true, length = 50)
    private String employeeCode;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", foreignKey = @ForeignKey(name = "fk_employees_department"))
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_position_id", foreignKey = @ForeignKey(name = "fk_employees_job_position"))
    private JobPosition jobPosition;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", foreignKey = @ForeignKey(name = "fk_employees_manager"))
    private Employee manager;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Column(name = "employee_type", length = 50)
    @Builder.Default
    private String employeeType = "FULL_TIME";

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "bank_account_no", length = 50)
    private String bankAccountNo;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "ifsc_code", length = 30)
    private String ifscCode;

    @Column(name = "emergency_contact_name", length = 100)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 30)
    private String emergencyContactPhone;

    public String getFullName() {
        return (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "");
    }
}
