package com.fedu.fedu.repository;

import com.fedu.fedu.entity.NodeExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NodeExerciseRepository extends JpaRepository<NodeExercise, Long> {
    List<NodeExercise> findByLearningNodeNodeIdAndIsDeletedFalse(Long nodeId);
}
