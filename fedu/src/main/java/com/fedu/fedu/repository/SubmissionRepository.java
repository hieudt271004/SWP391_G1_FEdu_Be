package com.fedu.fedu.repository;

import com.fedu.fedu.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    Optional<Submission> findByNodeExerciseExerciseIdAndStudentUserIdAndIsDeletedFalse(Long exerciseId, Long studentId);

    List<Submission> findByNodeExerciseExerciseIdAndIsDeletedFalseOrderBySubmittedAtAsc(Long exerciseId);
}
