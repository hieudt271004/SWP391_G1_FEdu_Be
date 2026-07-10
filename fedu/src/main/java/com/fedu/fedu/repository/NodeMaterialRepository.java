package com.fedu.fedu.repository;

import com.fedu.fedu.entity.NodeMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NodeMaterialRepository extends JpaRepository<NodeMaterial, Long> {
    List<NodeMaterial> findByLearningNodeNodeIdAndIsDeletedFalse(Long nodeId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(m) FROM NodeMaterial m " +
           "WHERE m.learningNode.learningPath.pathId = :pathId " +
           "AND m.isDeleted = false " +
           "AND (m.learningNode.level IS NULL OR m.learningNode.level = :level)")
    int countTotalMaterialsByPathIdAndLevel(@org.springframework.data.repository.query.Param("pathId") Long pathId, @org.springframework.data.repository.query.Param("level") Integer level);
}
