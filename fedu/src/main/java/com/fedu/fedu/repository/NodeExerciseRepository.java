package com.fedu.fedu.repository;

import com.fedu.fedu.entity.NodeExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NodeExerciseRepository extends JpaRepository<NodeExercise, Long> {
    List<NodeExercise> findByLearningNodeNodeIdAndIsDeletedFalse(Long nodeId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(e) FROM NodeExercise e " +
           "WHERE e.learningNode.nodeId IN :nodeIds " +
           "AND e.isDeleted = false")
    int countByLearningNodeNodeIdInAndIsDeletedFalse(@org.springframework.data.repository.query.Param("nodeIds") java.util.Collection<Long> nodeIds);
}
