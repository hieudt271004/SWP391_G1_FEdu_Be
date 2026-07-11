package com.fedu.fedu.repository;

import com.fedu.fedu.entity.StudentLevelHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentLevelHistoryRepository extends JpaRepository<StudentLevelHistory, Long> {

    List<StudentLevelHistory> findByStudentUserIdAndClassroomSubjectIdOrderByChangedAtAsc(
            Long studentId, Long classroomSubjectId);

    void deleteByStudentUserIdAndClassroomSubjectId(Long studentId, Long classroomSubjectId);
}
