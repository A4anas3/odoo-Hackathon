package com.odoo.hr.job.repository;

import com.odoo.hr.job.model.EmailJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmailJobRepository extends JpaRepository<EmailJob, UUID> {
    List<EmailJob> findByStatus(String status);
}
