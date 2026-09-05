package com.odoo.hr.job.repository;

import com.odoo.hr.job.model.NotificationJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationJobRepository extends JpaRepository<NotificationJob, UUID> {
    List<NotificationJob> findByStatus(String status);
}
