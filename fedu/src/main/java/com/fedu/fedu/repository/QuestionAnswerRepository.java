package com.fedu.fedu.repository;

import com.fedu.fedu.entity.QuestionAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionAnswerRepository extends JpaRepository<QuestionAnswer, Long> {
    
    List<QuestionAnswer> findByNodeQuestionQuestionIdInAndIsDeletedFalseOrderByCreatedAtAsc(List<Long> questionIds);
}
