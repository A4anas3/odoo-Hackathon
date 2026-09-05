package com.odoo.hr.timeoff.repository;

import com.odoo.hr.timeoff.model.TimeOffRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TimeOffRequestRepository extends JpaRepository<TimeOffRequest, UUID> {
    List<TimeOffRequest> findByEmployeeId(UUID employeeId);
    List<TimeOffRequest> findByEmployeeIdOrderByStartDateDesc(UUID employeeId);
    List<TimeOffRequest> findByStatus(String status);
}
