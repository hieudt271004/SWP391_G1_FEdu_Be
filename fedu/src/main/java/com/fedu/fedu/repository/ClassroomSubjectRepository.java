package com.fedu.fedu.repository;

import com.fedu.fedu.entity.ClassroomSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassroomSubjectRepository extends JpaRepository<ClassroomSubject, Long> {

    List<ClassroomSubject> findByClassroomClassroomId(Long classroomId);

    List<ClassroomSubject> findBySubjectSubjectId(Long subjectId);

    // Tìm mối quan hệ lớp học - môn học cụ thể
    Optional<ClassroomSubject> findByClassroomClassroomIdAndSubjectSubjectId(Long classroomId, Long subjectId);

    // Tìm tất cả lớp học của một giảng viên
    @Query("SELECT cs FROM ClassroomSubject cs WHERE cs.lecturer.userId = :lecturerId")
    List<ClassroomSubject> findByLecturerId(@Param("lecturerId") Long lecturerId);

    boolean existsByIdAndLecturerUserId(Long classroomSubjectId, Long lecturerId);
}
