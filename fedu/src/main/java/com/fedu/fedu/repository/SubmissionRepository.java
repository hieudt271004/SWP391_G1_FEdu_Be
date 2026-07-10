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

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT s.nodeExercise) FROM Submission s " +
           "WHERE s.student.userId = :studentId " +
           "AND s.nodeExercise.learningNode.learningPath.pathId = :pathId " +
           "AND s.isDeleted = false " +
           "AND s.nodeExercise.isDeleted = false " +
           "AND (s.nodeExercise.learningNode.level IS NULL OR s.nodeExercise.learningNode.level = :level) " +
           "AND s.status IN (com.fedu.fedu.utils.enums.SubmissionStatus.SUBMITTED, com.fedu.fedu.utils.enums.SubmissionStatus.GRADED)")
    int countCompletedExercisesByStudentAndPathAndLevel(
            @org.springframework.data.repository.query.Param("studentId") Long studentId, 
            @org.springframework.data.repository.query.Param("pathId") Long pathId, 
            @org.springframework.data.repository.query.Param("level") Integer level);
}
