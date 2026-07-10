package com.fedu.fedu.repository;

import com.fedu.fedu.entity.LearningPath;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LearningPathRepository extends JpaRepository<LearningPath, Long> {

    // templates theo môn
    List<LearningPath> findBySubjectSubjectIdAndClassroomSubjectIsNullAndIsDeletedFalse(Long subjectId);

    List<LearningPath> findByCreatedByUserIdAndClassroomSubjectIsNullAndIsDeletedFalse(Long userId);

    List<LearningPath> findAllByClassroomSubjectIdAndIsDeletedFalse(Long classroomSubjectId);

    Optional<LearningPath> findFirstByClassroomSubjectIdAndIsDeletedFalseOrderByPathIdAsc(Long classroomSubjectId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from LearningPath p where p.pathId = :pathId")
    Optional<LearningPath> findByPathIdForUpdate(@Param("pathId") Long pathId);
}
