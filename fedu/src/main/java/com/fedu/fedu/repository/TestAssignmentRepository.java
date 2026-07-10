package com.fedu.fedu.repository;

import com.fedu.fedu.entity.TestAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TestAssignmentRepository extends JpaRepository<TestAssignment, Long> {
    boolean existsByAssignmentIdAndClassroomSubjectLecturerUserId(Long assignmentId, Long lecturerId);
    List<TestAssignment> findByNodeNodeIdAndIsDeletedFalseOrderByCreatedAtDesc(Long nodeId);
}
