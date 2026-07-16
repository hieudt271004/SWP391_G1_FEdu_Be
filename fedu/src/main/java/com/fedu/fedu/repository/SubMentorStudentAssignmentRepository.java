package com.fedu.fedu.repository;

import com.fedu.fedu.entity.SubMentorStudentAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubMentorStudentAssignmentRepository extends JpaRepository<SubMentorStudentAssignment, Long> {

    
    boolean existsBySubMentorCss_IdAndStudentCss_Id(Long subMentorCssId, Long studentCssId);

    boolean existsByStudentCss_Id(Long studentCssId);

    
    List<SubMentorStudentAssignment> findBySubMentorCss_Id(Long subMentorCssId);

    
    List<SubMentorStudentAssignment> findByStudentCss_Id(Long studentCssId);

    
    @Query("SELECT a.studentCss.id FROM SubMentorStudentAssignment a WHERE a.subMentorCss.id = :subMentorCssId")
    List<Long> findStudentCssIdsBySubMentorCssId(@Param("subMentorCssId") Long subMentorCssId);

    
    void deleteBySubMentorCss_IdAndStudentCss_Id(Long subMentorCssId, Long studentCssId);

    
    void deleteByStudentCss_Id(Long studentCssId);

    
    void deleteBySubMentorCss_Id(Long subMentorCssId);
}
