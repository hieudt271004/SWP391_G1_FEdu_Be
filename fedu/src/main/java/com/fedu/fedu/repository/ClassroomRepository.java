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

    List<Classroom> findAllByIsDeletedFalse();

    long countByIsDeletedFalse();

    
    @Query("""
            SELECT c.classroomId AS classroomId,
                   COUNT(DISTINCT cs.id) AS subjectCount,
                   COUNT(DISTINCT css.id) AS studentCount
            FROM Classroom c
            LEFT JOIN ClassroomSubject cs ON cs.classroom = c
            LEFT JOIN ClassroomSubjectStudent css ON css.classroomSubject = cs
            WHERE c.isDeleted = false
            GROUP BY c.classroomId
            """)
    List<ClassroomCounts> countSubjectsAndStudentsPerClassroom();

    interface ClassroomCounts {
        Long getClassroomId();
        long getSubjectCount();
        long getStudentCount();
    }
}
