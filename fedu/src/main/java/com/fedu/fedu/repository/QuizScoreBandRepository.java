package com.fedu.fedu.repository;

import com.fedu.fedu.entity.QuizScoreBand;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizScoreBandRepository extends JpaRepository<QuizScoreBand, Long> {

    List<QuizScoreBand> findByTestTestIdOrderByMinScoreAsc(Long testId);

    void deleteByTestTestId(Long testId);
}
