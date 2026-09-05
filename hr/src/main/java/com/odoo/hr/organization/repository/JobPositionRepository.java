package com.odoo.hr.organization.repository;

import com.odoo.hr.organization.model.JobPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobPositionRepository extends JpaRepository<JobPosition, UUID> {
    List<JobPosition> findByDepartmentId(UUID departmentId);
    Optional<JobPosition> findByTitle(String title);
    boolean existsByTitle(String title);
}
