package com.fedu.fedu.repository;

import com.fedu.fedu.entity.NodeMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NodeMaterialRepository extends JpaRepository<NodeMaterial, Long> {
    List<NodeMaterial> findByLearningNodeNodeIdAndIsDeletedFalse(Long nodeId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(m) FROM NodeMaterial m " +
           "WHERE m.learningNode.nodeId IN :nodeIds " +
           "AND m.isDeleted = false")
    int countByLearningNodeNodeIdInAndIsDeletedFalse(@org.springframework.data.repository.query.Param("nodeIds") java.util.Collection<Long> nodeIds);
}
