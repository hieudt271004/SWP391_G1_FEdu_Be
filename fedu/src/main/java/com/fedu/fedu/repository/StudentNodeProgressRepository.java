package com.fedu.fedu.repository;

import com.fedu.fedu.entity.StudentNodeProgress;
import com.fedu.fedu.utils.enums.StudentProgressStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentNodeProgressRepository extends JpaRepository<StudentNodeProgress, Long> {

    boolean existsByLearningPathPathIdAndStatus(Long pathId, StudentProgressStatus status);

    void deleteAllByLearningPathPathId(Long pathId);

    List<StudentNodeProgress> findByStudentUserIdAndLearningPathPathId(Long userId, Long pathId);

    void deleteByLearningNodeNodeId(Long nodeId);
}
