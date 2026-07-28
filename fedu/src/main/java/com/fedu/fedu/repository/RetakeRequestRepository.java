package com.fedu.fedu.repository;

import com.fedu.fedu.entity.RetakeRequest;
import com.fedu.fedu.utils.enums.RetakeRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RetakeRequestRepository extends JpaRepository<RetakeRequest, Long> {

    List<RetakeRequest> findByStudentUserIdAndClassroomSubjectIdOrderByRequestedAtDesc(
            Long studentId, Long classroomSubjectId);

    List<RetakeRequest> findByClassroomSubjectIdAndStatusOrderByRequestedAtAsc(
            Long classroomSubjectId, RetakeRequestStatus status);

    List<RetakeRequest> findByClassroomSubjectIdOrderByRequestedAtAsc(Long classroomSubjectId);

    Optional<RetakeRequest> findFirstByStudentUserIdAndTestTestIdAndStatus(
            Long studentId, Long testId, RetakeRequestStatus status);

    List<RetakeRequest> findByStudentUserIdAndTestTestIdAndStatus(
            Long studentId, Long testId, RetakeRequestStatus status);
}
