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

    @org.springframework.data.jpa.repository.Query("SELECT s FROM Submission s " +
           "WHERE s.student.userId = :studentId " +
           "AND s.nodeExercise.learningNode.learningPath.classroomSubject.id = :classroomSubjectId " +
           "AND s.isDeleted = false " +
           "AND s.nodeExercise.isDeleted = false")
    List<Submission> findByStudentAndClassroomSubject(
            @org.springframework.data.repository.query.Param("studentId") Long studentId,
            @org.springframework.data.repository.query.Param("classroomSubjectId") Long classroomSubjectId);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM Submission s " +
           "WHERE s.nodeExercise.learningNode.learningPath.classroomSubject.id = :classroomSubjectId " +
           "AND s.isDeleted = false " +
           "AND s.nodeExercise.isDeleted = false")
    List<Submission> findAllByClassroomSubject(
            @org.springframework.data.repository.query.Param("classroomSubjectId") Long classroomSubjectId);
}
