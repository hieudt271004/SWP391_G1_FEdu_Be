package com.fedu.fedu.repository;

import com.fedu.fedu.entity.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    List<Classroom> findByLecturer_UserIdAndIsDeletedFalse(Long lecturerId);
}
