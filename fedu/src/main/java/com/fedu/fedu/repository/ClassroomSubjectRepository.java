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

    long countByClassroomClassroomId(Long classroomId);

    @Query("SELECT cs FROM ClassroomSubject cs WHERE cs.subject.subjectId = :subjectId AND cs.classroom.isDeleted = false")
    List<ClassroomSubject> findBySubjectSubjectId(@Param("subjectId") Long subjectId);


    Optional<ClassroomSubject> findByClassroomClassroomIdAndSubjectSubjectId(Long classroomId, Long subjectId);


    @Query("SELECT cs FROM ClassroomSubject cs WHERE cs.lecturer.userId = :lecturerId AND cs.classroom.isDeleted = false")
    List<ClassroomSubject> findByLecturerId(@Param("lecturerId") Long lecturerId);

    boolean existsByIdAndLecturerUserId(Long classroomSubjectId, Long lecturerId);

    boolean existsBySubjectSubjectIdAndLecturerUserId(Long subjectId, Long lecturerId);

    boolean existsByClassroomClassroomIdAndLecturerUserId(Long classroomId, Long lecturerId);

    Optional<ClassroomSubject> findByQuizStartTestId(Long testId);
}
