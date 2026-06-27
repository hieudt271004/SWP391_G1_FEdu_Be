package com.fedu.fedu.repository;

import com.fedu.fedu.entity.NodeQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NodeQuestionRepository extends JpaRepository<NodeQuestion, Long> {
    List<NodeQuestion> findByLearningNodeNodeIdAndIsDeletedFalseOrderByCreatedAtAsc(Long nodeId);
}
