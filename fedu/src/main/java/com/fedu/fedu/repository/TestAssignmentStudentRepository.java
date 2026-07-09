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

    /**
     * Assignment (giao cho chính học sinh này) gần nhất tại một node — dùng cho polling.
     * Single indexed query: index test_assignments(node_id, status) + test_assignment_students(classroom_subject_student_id).
     */
    @Query("SELECT tas FROM TestAssignmentStudent tas " +
           "JOIN tas.assignment a " +
           "JOIN tas.classroomSubjectStudent css " +
           "WHERE a.node.nodeId = :nodeId AND css.student.userId = :studentId AND tas.isDeleted = false " +
           "ORDER BY a.createdAt DESC")
    List<TestAssignmentStudent> findByNodeIdAndStudentIdOrderByAssignmentCreatedAtDesc(
            @Param("nodeId") Long nodeId, @Param("studentId") Long studentId);

    /** Khóa row khi start để chống race — hai request start song song chỉ 1 cái thắng. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT tas FROM TestAssignmentStudent tas JOIN tas.classroomSubjectStudent css " +
           "WHERE tas.assignment.assignmentId = :assignmentId AND css.student.userId = :studentId")
    Optional<TestAssignmentStudent> findByAssignmentIdAndStudentIdForUpdate(
            @Param("assignmentId") Long assignmentId, @Param("studentId") Long studentId);

    Optional<TestAssignmentStudent> findByAssignmentAssignmentIdAndClassroomSubjectStudentId(
            Long assignmentId, Long classroomSubjectStudentId);

    /** Khóa row theo id — dùng khi finalize-lười trong lúc giáo viên xem kết quả hoặc reset. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT tas FROM TestAssignmentStudent tas WHERE tas.id = :id")
    Optional<TestAssignmentStudent> findByIdForUpdate(@Param("id") Long id);

    /** Fetch-join tránh N+1 cho bảng kết quả giáo viên. */
    @Query("SELECT tas FROM TestAssignmentStudent tas " +
           "JOIN FETCH tas.classroomSubjectStudent css " +
           "JOIN FETCH css.student " +
           "LEFT JOIN FETCH tas.attempt " +
           "WHERE tas.assignment.assignmentId = :assignmentId AND tas.isDeleted = false")
    List<TestAssignmentStudent> findByAssignmentIdWithDetails(@Param("assignmentId") Long assignmentId);
}
