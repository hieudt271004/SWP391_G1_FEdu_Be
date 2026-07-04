package com.fedu.fedu.repository;

import com.fedu.fedu.entity.QuestionAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionAnswerRepository extends JpaRepository<QuestionAnswer, Long> {
    /** Lấy tất cả câu trả lời (chưa xóa) của một loạt câu hỏi trong 1 query (tránh N+1). */
    List<QuestionAnswer> findByNodeQuestionQuestionIdInAndIsDeletedFalseOrderByCreatedAtAsc(List<Long> questionIds);
}
