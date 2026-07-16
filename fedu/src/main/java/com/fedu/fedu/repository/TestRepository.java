package com.fedu.fedu.repository;

import com.fedu.fedu.entity.Test;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestRepository extends JpaRepository<Test, Long> {
    List<Test> findByLearningNodeNodeIdAndIsDeletedFalse(Long nodeId);
    Optional<Test> findByTestIdAndIsDeletedFalse(Long testId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(t) FROM Test t " +
           "WHERE t.learningNode.nodeId IN :nodeIds " +
           "AND t.isDeleted = false")
    int countByLearningNodeNodeIdInAndIsDeletedFalse(@org.springframework.data.repository.query.Param("nodeIds") java.util.Collection<Long> nodeIds);
}
