package com.odoo.hr.timeoff.repository;

import com.odoo.hr.timeoff.model.TimeOffType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TimeOffTypeRepository extends JpaRepository<TimeOffType, UUID> {
    Optional<TimeOffType> findByName(String name);
}
