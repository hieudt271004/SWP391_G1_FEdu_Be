package com.fedu.fedu.repository;

import com.fedu.fedu.entity.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, Long> {

    Optional<Classroom> findByClassroomIdAndIsDeletedFalse(Long classroomId);

    @Query("SELECT c FROM Classroom c WHERE c.isDeleted = false ORDER BY c.createdAt DESC")
    List<Classroom> findAllActive();

    @Query("SELECT c FROM Classroom c WHERE c.subject.subjectId = :subjectId AND c.isDeleted = false ORDER BY c.createdAt DESC")
    List<Classroom> findAllBySubject(Long subjectId);

    @Query("SELECT c FROM Classroom c WHERE c.lecturer.userId = :lecturerId AND c.isDeleted = false ORDER BY c.createdAt DESC")
    List<Classroom> findAllByLecturer(long lecturerId);
}
