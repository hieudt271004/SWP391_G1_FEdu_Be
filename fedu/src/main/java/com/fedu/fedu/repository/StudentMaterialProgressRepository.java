package com.fedu.fedu.repository;

import com.fedu.fedu.entity.StudentMaterialProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentMaterialProgressRepository extends JpaRepository<StudentMaterialProgress, Long> {

    @Query("SELECT p.material.materialId FROM StudentMaterialProgress p " +
           "WHERE p.classroomSubjectStudent.student.userId = :studentId")
    List<Long> findCompletedMaterialIdsByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END " +
           "FROM StudentMaterialProgress p " +
           "WHERE p.classroomSubjectStudent.id = :enrollmentId " +
           "AND p.material.materialId = :materialId")
    boolean existsByEnrollmentAndMaterial(@Param("enrollmentId") Long enrollmentId, @Param("materialId") Long materialId);

    @Query("SELECT COUNT(p) FROM StudentMaterialProgress p " +
           "WHERE p.classroomSubjectStudent.student.userId = :studentId " +
           "AND p.material.learningNode.nodeId IN :nodeIds")
    int countCompletedMaterialsByStudentAndNodeIds(
            @Param("studentId") Long studentId,
            @Param("nodeIds") java.util.Collection<Long> nodeIds);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM StudentMaterialProgress p " +
           "WHERE p.classroomSubjectStudent.student.userId = :studentId " +
           "AND p.material.learningNode.nodeId IN :nodeIds")
    void deleteByStudentAndNodeIds(
            @Param("studentId") Long studentId,
            @Param("nodeIds") java.util.Collection<Long> nodeIds);
}
