package com.fedu.fedu.repository;

import com.fedu.fedu.entity.LearningPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface LearningPathRepository extends JpaRepository<LearningPath, Long> {

    // Lộ trình mẫu theo môn học
    List<LearningPath> findBySubjectSubjectIdAndClassroomIsNullAndIsDeletedFalse(Long subjectId);

    // Lộ trình đã clone riêng cho một lớp học (gộp từ ClassroomLearningPathRepository cũ)
    Optional<LearningPath> findByClassroomClassroomIdAndIsDeletedFalse(Long classroomId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from LearningPath p where p.pathId = :pathId")
    Optional<LearningPath> findByPathIdForUpdate(@Param("pathId") Long pathId);
}