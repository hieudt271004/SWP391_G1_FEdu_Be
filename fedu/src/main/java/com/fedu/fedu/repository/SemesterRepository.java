package com.fedu.fedu.repository;

import com.fedu.fedu.entity.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface SemesterRepository extends JpaRepository<Semester, Long> {
    Optional<Semester> findByTermAndAcademicYear(String term, Integer academicYear);

    @Query("SELECT s FROM Semester s WHERE :date >= s.startDate AND :date <= s.endDate")
    Optional<Semester> findSemesterByDate(@Param("date") LocalDate date);
}
