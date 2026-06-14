package com.fedu.fedu.repository;

import com.fedu.fedu.entity.StudentTestResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentTestResponseRepository extends JpaRepository<StudentTestResponse, Long> {
    List<StudentTestResponse> findByStudentTestAttemptAttemptId(Long attemptId);
}
