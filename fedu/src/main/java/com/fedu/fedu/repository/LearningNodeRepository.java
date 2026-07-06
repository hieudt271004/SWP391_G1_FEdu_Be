package com.fedu.fedu.repository;

import com.fedu.fedu.entity.LearningNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.time.LocalDate;

@Repository
public interface LearningNodeRepository extends JpaRepository<LearningNode, Long> {

    // Lấy tất cả nodes của một learning path (template hoặc classroom path)
    @Query("SELECT n FROM LearningNode n WHERE n.learningPath.pathId = :pathId AND n.isDeleted = false ORDER BY n.displayOrder ASC")
    List<LearningNode> findByLearningPathPathIdAndIsDeletedFalse(@Param("pathId") Long pathId);

    // Lấy tất cả nodes của các learning paths thuộc một môn học (template paths)
    @Query("""
            SELECT n
            FROM LearningNode n
            JOIN n.learningPath p
            WHERE p.subject.subjectId = :subjectId
            AND n.isDeleted = false
            AND p.isDeleted = false
            AND p.classroomSubject IS NULL
            ORDER BY p.pathId ASC
            """)
    List<LearningNode> findAllTemplateNodesBySubjectId(@Param("subjectId") Long subjectId);

    // Lấy tất cả nodes của các learning paths thuộc một lớp học
    @Query("""
            SELECT n
            FROM LearningNode n
            JOIN n.learningPath p
            WHERE p.classroomSubject.id = :classroomSubjectId
            AND n.isDeleted = false
            AND p.isDeleted = false
            ORDER BY p.pathId ASC
            """)
    List<LearningNode> findAllClassroomNodesByClassroomId(@Param("classroomSubjectId") Long classroomSubjectId);

    @Query("SELECT n FROM LearningNode n WHERE n.learningPath.classroomSubject.lecturer.userId = :lecturerId " +
           "AND n.studyDate = :studyDate AND n.slot.slotId = :slotId AND n.nodeId <> :nodeId AND n.isDeleted = false")
    List<LearningNode> findTeacherConflicts(@Param("lecturerId") Long lecturerId,
                                            @Param("studyDate") LocalDate studyDate,
                                            @Param("slotId") Long slotId,
                                            @Param("nodeId") Long nodeId);

    @Query("SELECT n FROM LearningNode n, ClassroomSubjectStudent css " +
           "WHERE n.learningPath.classroomSubject.id = css.classroomSubject.id " +
           "AND css.student.userId IN :studentIds AND n.studyDate = :studyDate AND n.slot.slotId = :slotId " +
           "AND n.learningPath.classroomSubject.id <> :csId AND n.isDeleted = false")
    List<LearningNode> findStudentsConflicts(@Param("studentIds") Collection<Long> studentIds,
                                             @Param("studyDate") LocalDate studyDate,
                                             @Param("slotId") Long slotId,
                                             @Param("csId") Long csId);

    @Query("SELECT n FROM LearningNode n, ClassroomSubjectStudent css " +
           "WHERE n.learningPath.classroomSubject.id = css.classroomSubject.id " +
           "AND css.student.userId = :studentId " +
           "AND n.studyDate IS NOT NULL " +
           "AND n.isDeleted = false")
    List<LearningNode> findScheduledNodesForStudent(@Param("studentId") Long studentId);
}
