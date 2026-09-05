package com.odoo.hr.timeoff.repository;

import com.odoo.hr.timeoff.model.TimeOffAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TimeOffAllocationRepository extends JpaRepository<TimeOffAllocation, UUID> {
    List<TimeOffAllocation> findByEmployeeId(UUID employeeId);
    Optional<TimeOffAllocation> findByEmployeeIdAndTimeOffTypeId(UUID employeeId, UUID timeOffTypeId);
}
