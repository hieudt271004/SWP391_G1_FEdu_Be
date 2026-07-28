package com.fedu.fedu.repository;

import com.fedu.fedu.entity.NodeMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NodeMaterialRepository extends JpaRepository<NodeMaterial, Long> {
    List<NodeMaterial> findByLearningNodeNodeIdAndIsDeletedFalse(Long nodeId);
}
