package com.lecture.user.repository;

import com.lecture.user.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    boolean existsByBusinessNumber(String businessNumber);
}
