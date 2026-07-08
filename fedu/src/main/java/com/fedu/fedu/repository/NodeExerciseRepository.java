package com.fedu.fedu.repository;

import com.fedu.fedu.entity.NodeExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NodeExerciseRepository extends JpaRepository<NodeExercise, Long> {
    List<NodeExercise> findByLearningNodeNodeIdAndIsDeletedFalse(Long nodeId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(e) FROM NodeExercise e " +
           "WHERE e.learningNode.learningPath.pathId = :pathId " +
           "AND e.isDeleted = false " +
           "AND (e.learningNode.level IS NULL OR e.learningNode.level = :level)")
    int countTotalExercisesByPathIdAndLevel(@org.springframework.data.repository.query.Param("pathId") Long pathId, @org.springframework.data.repository.query.Param("level") Integer level);
}
