package com.fedu.fedu.repository;

import com.fedu.fedu.entity.ClassroomStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassroomStudentRepository extends JpaRepository<ClassroomStudent, Long> {

    boolean existsByClassroom_ClassroomIdAndStudent_UserId(Long classroomId, long studentId);

    Optional<ClassroomStudent> findByClassroom_ClassroomIdAndStudent_UserId(Long classroomId, long studentId);

    @Query("SELECT cs FROM ClassroomStudent cs WHERE cs.classroom.classroomId = :classroomId")
    List<ClassroomStudent> findAllByClassroomId(Long classroomId);

    @Query("SELECT cs FROM ClassroomStudent cs WHERE cs.student.userId = :studentId")
    List<ClassroomStudent> findAllByStudentId(long studentId);
}
