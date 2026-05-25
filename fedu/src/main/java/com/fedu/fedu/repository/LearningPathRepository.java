package com.fedu.fedu.repository;

import com.fedu.fedu.entity.LearningPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningPathRepository extends JpaRepository<LearningPath, Long> {
    List<LearningPath> findBySubjectSubjectIdAndIsDeletedFalse(Long subjectId);
}