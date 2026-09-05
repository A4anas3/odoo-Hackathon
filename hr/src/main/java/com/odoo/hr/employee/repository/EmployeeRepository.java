package com.odoo.hr.employee.repository;

import com.odoo.hr.employee.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    Optional<Employee> findByAuthProviderUserId(String authProviderUserId);

    boolean existsByAuthProviderUserId(String authProviderUserId);

    Optional<Employee> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<Employee> findByEmployeeCode(String employeeCode);

    boolean existsByEmployeeCode(String employeeCode);

    List<Employee> findByStatus(String status);
    long countByDepartmentId(UUID departmentId);
}
