package com.fedu.fedu.repository;

import com.fedu.fedu.entity.LearningNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningNodeRepository extends JpaRepository<LearningNode, Long> {

    // node gốc
    List<LearningNode> findByLearningPathPathIdAndIsDeletedFalseOrderByDisplayOrderAsc(Long pathId);

    // node clone
    List<LearningNode>
    findByClassroomLearningPathClassroomPathIdAndIsDeletedFalseOrderByDisplayOrderAsc(
            Long classroomPathId
    );

    @Query("""
            SELECT n
            FROM LearningNode n
            JOIN n.learningPath p
            WHERE p.subject.subjectId = :subjectId
            AND n.isDeleted = false
            AND p.isDeleted = false
            ORDER BY p.pathId ASC, n.displayOrder ASC
            """)
    List<LearningNode> findAllTemplateNodesBySubjectId(@Param("subjectId") Long subjectId);

    @Query("""
            SELECT n
            FROM LearningNode n
            JOIN n.classroomLearningPath cp
            WHERE cp.classroom.classroomId = :classroomId
            AND n.isDeleted = false
            AND cp.isDeleted = false
            ORDER BY cp.classroomPathId ASC, n.displayOrder ASC
            """)
    List<LearningNode> findAllClassroomNodesByClassroomId(@Param("classroomId") Long classroomId);
}
