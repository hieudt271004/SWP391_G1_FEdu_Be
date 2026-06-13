package com.fedu.fedu.repository;

import com.fedu.fedu.entity.Test;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestRepository extends JpaRepository<Test, Long> {
    List<Test> findByLearningNodeNodeIdAndIsDeletedFalse(Long nodeId);
}
