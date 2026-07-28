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

    // Mọi đề (còn sống) thuộc lộ trình của một lớp-môn — để chọn đề có sẵn giao pop quiz.
    @org.springframework.data.jpa.repository.Query(
            "SELECT t FROM Test t " +
            "WHERE t.learningNode.learningPath.classroomSubject.id = :csId " +
            "AND t.isDeleted = false")
    List<Test> findByClassroomSubjectId(
            @org.springframework.data.repository.query.Param("csId") Long csId);
}
