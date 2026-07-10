package com.fedu.fedu.repository;

import com.fedu.fedu.entity.StudentNodeProgress;
import com.fedu.fedu.utils.enums.StudentProgressStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentNodeProgressRepository extends JpaRepository<StudentNodeProgress, Long> {

    boolean existsByLearningPathPathIdAndStatus(Long pathId, StudentProgressStatus status);

    void deleteAllByLearningPathPathId(Long pathId);

    // Progress nối tới enrollment (classroom_subject_student); lọc theo userId học sinh qua CSS.
    @Query("SELECT p FROM StudentNodeProgress p " +
            "WHERE p.classroomSubjectStudent.student.userId = :userId AND p.learningPath.pathId = :pathId")
    List<StudentNodeProgress> findByStudentUserIdAndLearningPathPathId(@Param("userId") Long userId, @Param("pathId") Long pathId);

    @Modifying
    @Query("DELETE FROM StudentNodeProgress p " +
            "WHERE p.classroomSubjectStudent.student.userId = :userId AND p.learningPath.pathId = :pathId")
    void deleteByStudentUserIdAndLearningPathPathId(@Param("userId") Long userId, @Param("pathId") Long pathId);

    List<StudentNodeProgress> findByLearningNodeNodeId(Long nodeId);

    @Query("SELECT p FROM StudentNodeProgress p WHERE p.classroomSubjectStudent.student.userId = :studentId")
    List<StudentNodeProgress> findAllByStudentId(@Param("studentId") Long studentId);

    // Toàn bộ progress của 1 path (báo cáo lớp) — JOIN FETCH để group trong bộ nhớ không dính N+1;
    // loại node đã soft-delete (xóa node vẫn để lại progress rows).
    @Query("SELECT p FROM StudentNodeProgress p " +
            "JOIN FETCH p.learningNode n " +
            "JOIN FETCH p.classroomSubjectStudent " +
            "WHERE p.learningPath.pathId = :pathId AND n.isDeleted = false")
    List<StudentNodeProgress> findByLearningPathPathId(@Param("pathId") Long pathId);
}
