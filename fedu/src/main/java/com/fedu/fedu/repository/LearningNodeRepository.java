package com.fedu.fedu.repository;

import com.fedu.fedu.entity.LearningNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

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
}
