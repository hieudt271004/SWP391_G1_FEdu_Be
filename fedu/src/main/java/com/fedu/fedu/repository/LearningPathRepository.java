package com.fedu.fedu.repository;

import com.fedu.fedu.entity.LearningPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningPathRepository extends JpaRepository<LearningPath, Long> {

    // Lộ trình mẫu theo môn học
    List<LearningPath> findBySubjectSubjectIdAndIsDeletedFalse(Long subjectId);

    // Lộ trình đã clone riêng cho một lớp học (gộp từ ClassroomLearningPathRepository cũ)
    List<LearningPath> findByClassroomClassroomIdAndIsDeletedFalse(Long classroomId);
}