package com.fedu.fedu.repository;

import com.fedu.fedu.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {

    boolean existsBySubjectCode(String subjectCode);

    Optional<Subject> findBySubjectIdAndIsDeletedFalse(Long subjectId);

    @Query("SELECT s FROM Subject s WHERE s.isDeleted = false ORDER BY s.createdAt DESC")
    List<Subject> findAllActive();

    long countByIsDeletedFalse();

    @Query("SELECT s FROM Subject s WHERE s.isDeleted = false AND s.createdBy.userId = :teacherId ORDER BY s.createdAt DESC")
    List<Subject> findAllByTeacher(long teacherId);
}
