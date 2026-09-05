package com.odoo.hr.schedule.repository;

import com.odoo.hr.schedule.model.WorkingSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkingScheduleRepository extends JpaRepository<WorkingSchedule, UUID> {
    Optional<WorkingSchedule> findByName(String name);
}
