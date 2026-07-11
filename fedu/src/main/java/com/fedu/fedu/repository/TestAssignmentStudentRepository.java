package com.fedu.fedu.repository;

import com.fedu.fedu.entity.TestAssignmentStudent;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestAssignmentStudentRepository extends JpaRepository<TestAssignmentStudent, Long> {

    



    @Query("SELECT tas FROM TestAssignmentStudent tas " +
           "JOIN tas.assignment a " +
           "JOIN tas.classroomSubjectStudent css " +
           "WHERE a.node.nodeId = :nodeId AND css.student.userId = :studentId AND tas.isDeleted = false " +
           "ORDER BY a.createdAt DESC")
    List<TestAssignmentStudent> findByNodeIdAndStudentIdOrderByAssignmentCreatedAtDesc(
            @Param("nodeId") Long nodeId, @Param("studentId") Long studentId);

    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT tas FROM TestAssignmentStudent tas JOIN tas.classroomSubjectStudent css " +
           "WHERE tas.assignment.assignmentId = :assignmentId AND css.student.userId = :studentId")
    Optional<TestAssignmentStudent> findByAssignmentIdAndStudentIdForUpdate(
            @Param("assignmentId") Long assignmentId, @Param("studentId") Long studentId);

    Optional<TestAssignmentStudent> findByAssignmentAssignmentIdAndClassroomSubjectStudentId(
            Long assignmentId, Long classroomSubjectStudentId);

    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT tas FROM TestAssignmentStudent tas WHERE tas.id = :id")
    Optional<TestAssignmentStudent> findByIdForUpdate(@Param("id") Long id);

    
    @Query("SELECT tas FROM TestAssignmentStudent tas " +
           "JOIN FETCH tas.classroomSubjectStudent css " +
           "JOIN FETCH css.student " +
           "LEFT JOIN FETCH tas.attempt " +
           "WHERE tas.assignment.assignmentId = :assignmentId AND tas.isDeleted = false")
    List<TestAssignmentStudent> findByAssignmentIdWithDetails(@Param("assignmentId") Long assignmentId);
}
