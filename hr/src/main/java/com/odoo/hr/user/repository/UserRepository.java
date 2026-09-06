package com.odoo.hr.user.repository;

import com.odoo.hr.user.model.Role;
import com.odoo.hr.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    Optional<User> findByEmployeeId(UUID employeeId);

    List<User> findByEmployeeIdIn(List<UUID> employeeIds);

    @Query("""
        SELECT DISTINCT u FROM User u
        LEFT JOIN u.employee e
        LEFT JOIN u.roles r
        WHERE (:search IS NULL OR :search = '' OR
               LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR
               (e IS NOT NULL AND (
                   LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', :search, '%'))
               )))
          AND (:role IS NULL OR :role MEMBER OF u.roles)
          AND (:status IS NULL OR :status = '' OR LOWER(u.status) = LOWER(:status))
        ORDER BY u.createdAt DESC
    """)
    List<User> searchUsers(
        @Param("search") String search,
        @Param("role") Role role,
        @Param("status") String status
    );
}
