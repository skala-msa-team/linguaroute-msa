package com.lecture.user.repository;

import com.lecture.user.entity.CompanyEntitlement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyEntitlementRepository extends JpaRepository<CompanyEntitlement, Long> {

    Optional<CompanyEntitlement> findByCompany_Id(Long companyId);
}
