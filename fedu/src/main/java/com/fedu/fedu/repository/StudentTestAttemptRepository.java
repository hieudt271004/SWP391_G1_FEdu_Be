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

    List<StudentTestAttempt> findByStudentUserIdAndTestLearningNodeNodeIdIn(
            Long studentId, java.util.Collection<Long> nodeIds);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM StudentTestAttempt a " +
           "WHERE a.test.learningNode.learningPath.classroomSubject.id = :classroomSubjectId " +
           "AND a.test.isDeleted = false")
    List<StudentTestAttempt> findAllByClassroomSubject(
            @org.springframework.data.repository.query.Param("classroomSubjectId") Long classroomSubjectId);
}
