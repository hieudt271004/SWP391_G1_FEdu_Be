package com.fedu.fedu.repository;

import com.fedu.fedu.entity.ClassroomLearningPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassroomLearningPathRepository extends JpaRepository<ClassroomLearningPath, Long> {

    List<ClassroomLearningPath> findByClassroomClassroomIdAndIsDeletedFalse(Long classroomId);

}