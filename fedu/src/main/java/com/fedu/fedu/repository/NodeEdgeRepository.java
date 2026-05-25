package com.fedu.fedu.repository;

import com.fedu.fedu.entity.NodeEdge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NodeEdgeRepository extends JpaRepository<NodeEdge, Long> {

    List<NodeEdge> findByFromNodeNodeIdIn(List<Long> nodeIds);

}