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
    long countByStatus(String status);
    long countByDepartmentId(UUID departmentId);
    long countByJobPositionId(UUID jobPositionId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"department", "jobPosition", "manager", "workingSchedule"})
    org.springframework.data.domain.Page<Employee> findAll(org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"department", "jobPosition", "manager", "workingSchedule"})
    @org.springframework.data.jpa.repository.Query("""
        SELECT e FROM Employee e
        LEFT JOIN e.department d
        WHERE (:search IS NULL OR :search = '' OR
               LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:department IS NULL OR :department = '' OR :department = 'ALL' OR LOWER(d.name) = LOWER(:department))
          AND (:status IS NULL OR :status = '' OR :status = 'ALL' OR UPPER(e.status) = UPPER(:status))
          AND (:type IS NULL OR :type = '' OR :type = 'ALL' OR UPPER(e.employeeType) = UPPER(:type))
    """)
    org.springframework.data.domain.Page<Employee> findWithFilters(
        @org.springframework.data.repository.query.Param("search") String search,
        @org.springframework.data.repository.query.Param("department") String department,
        @org.springframework.data.repository.query.Param("status") String status,
        @org.springframework.data.repository.query.Param("type") String type,
        org.springframework.data.domain.Pageable pageable
    );
}
