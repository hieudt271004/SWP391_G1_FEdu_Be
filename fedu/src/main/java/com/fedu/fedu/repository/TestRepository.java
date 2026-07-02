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
}
