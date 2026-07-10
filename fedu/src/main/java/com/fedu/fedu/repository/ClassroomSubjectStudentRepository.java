package com.fedu.fedu.repository;

import com.fedu.fedu.entity.ClassroomSubjectStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassroomSubjectStudentRepository extends JpaRepository<ClassroomSubjectStudent, Long> {

    Optional<ClassroomSubjectStudent> findByClassroomSubject_IdAndStudent_UserId(Long classroomSubjectId, long studentId);

    @Query("SELECT cs FROM ClassroomSubjectStudent cs WHERE cs.classroomSubject.classroom.classroomId = :classroomId")
    List<ClassroomSubjectStudent> findAllByClassroomId(Long classroomId);

    @Query("SELECT COUNT(cs) FROM ClassroomSubjectStudent cs WHERE cs.classroomSubject.classroom.classroomId = :classroomId")
    long countAllByClassroomId(@Param("classroomId") Long classroomId);

    @Query("SELECT cs FROM ClassroomSubjectStudent cs WHERE cs.classroomSubject.id = :classroomSubjectId")
    List<ClassroomSubjectStudent> findAllByClassroomSubjectId(Long classroomSubjectId);

    // Kèm JOIN FETCH student cho báo cáo lớp (tránh N+1 khi đọc tên/email từng học sinh)
    @Query("SELECT cs FROM ClassroomSubjectStudent cs JOIN FETCH cs.student WHERE cs.classroomSubject.id = :csId")
    List<ClassroomSubjectStudent> findAllByClassroomSubjectIdWithStudent(@Param("csId") Long csId);

    @Query("SELECT COUNT(cs) FROM ClassroomSubjectStudent cs WHERE cs.classroomSubject.id = :classroomSubjectId")
    long countAllByClassroomSubjectId(@Param("classroomSubjectId") Long classroomSubjectId);

    @Query("SELECT cs FROM ClassroomSubjectStudent cs WHERE cs.student.userId = :studentId")
    List<ClassroomSubjectStudent> findAllByStudentId(long studentId);

    @Query("SELECT DISTINCT cs.student FROM ClassroomSubjectStudent cs WHERE cs.classroomSubject.classroom.classroomId = :classroomId")
    List<com.fedu.fedu.entity.UserAccount> findDistinctStudentsByClassroomId(@org.springframework.data.repository.query.Param("classroomId") Long classroomId);

    @Query("SELECT DISTINCT cs.student FROM ClassroomSubjectStudent cs WHERE cs.classroomSubject.id = :csId")
    List<com.fedu.fedu.entity.UserAccount> findDistinctStudentsByClassroomSubjectId(@Param("csId") Long csId);

    boolean existsByClassroomSubject_IdAndStudent_UserId(Long classroomSubjectId, Long studentId);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT cs FROM ClassroomSubjectStudent cs WHERE cs.classroomSubject.id = :classroomSubjectId AND cs.student.userId = :studentId")
    Optional<ClassroomSubjectStudent> findByClassroomSubjectIdAndStudentIdForUpdate(
            @Param("classroomSubjectId") Long classroomSubjectId,
            @Param("studentId") Long studentId);
}
