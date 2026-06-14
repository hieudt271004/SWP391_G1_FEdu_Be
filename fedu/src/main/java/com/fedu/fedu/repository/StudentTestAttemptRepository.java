package com.fedu.fedu.repository;

import com.fedu.fedu.entity.StudentTestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentTestAttemptRepository extends JpaRepository<StudentTestAttempt, Long> {
    List<StudentTestAttempt> findByStudentUserIdAndTestTestId(Long studentId, Long testId);
    Optional<StudentTestAttempt> findFirstByStudentUserIdAndTestTestIdOrderBySubmittedAtDesc(Long studentId, Long testId);
}
