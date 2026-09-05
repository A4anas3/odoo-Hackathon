package com.odoo.hr.job.repository;

import com.odoo.hr.job.model.PdfJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PdfJobRepository extends JpaRepository<PdfJob, UUID> {
    List<PdfJob> findByStatus(String status);
}
