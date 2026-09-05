package com.odoo.hr.contract.repository;

import com.odoo.hr.contract.model.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractRepository extends JpaRepository<Contract, UUID> {

    List<Contract> findByEmployeeId(UUID employeeId);

    List<Contract> findByEmployeeIdOrderByStartDateDesc(UUID employeeId);

    Optional<Contract> findFirstByEmployeeIdAndStatus(UUID employeeId, String status);

    List<Contract> findByStatus(String status);
}
