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
    List<StudentTestAttempt> findByStudentUserIdOrderBySubmittedAtDesc(Long studentId);
    List<StudentTestAttempt> findByTestTestId(Long testId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT a.test) FROM StudentTestAttempt a " +
           "WHERE a.student.userId = :studentId " +
           "AND a.test.learningNode.learningPath.pathId = :pathId " +
           "AND a.test.isDeleted = false " +
           "AND (a.test.learningNode.level IS NULL OR a.test.learningNode.level = :level) " +
           "AND a.score >= COALESCE(a.test.passingPercentage, 0)")
    int countCompletedTestsByStudentAndPathAndLevel(
            @org.springframework.data.repository.query.Param("studentId") Long studentId, 
            @org.springframework.data.repository.query.Param("pathId") Long pathId, 
            @org.springframework.data.repository.query.Param("level") Integer level);
}
