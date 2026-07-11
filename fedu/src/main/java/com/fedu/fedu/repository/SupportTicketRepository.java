package com.fedu.fedu.repository;

import com.fedu.fedu.entity.SupportTicket;
import com.fedu.fedu.utils.enums.SupportTicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    
    List<SupportTicket> findByClassroomSubjectStudent_IdAndIsDeletedFalseOrderByCreatedAtDesc(Long classroomSubjectStudentId);

    



    @Query("""
        SELECT t FROM SupportTicket t
        WHERE t.classroomSubjectStudent.id IN :studentCssIds
          AND t.status = 'NONE'
          AND t.isDeleted = false
        ORDER BY t.createdAt DESC
        """)
    List<SupportTicket> findByStudentCssIds(@Param("studentCssIds") List<Long> studentCssIds);

    



    @Query("""
        SELECT t FROM SupportTicket t
        WHERE t.status = :status
          AND t.classroomSubjectStudent.classroomSubject.id = :classroomSubjectId
          AND t.isDeleted = false
        ORDER BY t.createdAt DESC
        """)
    List<SupportTicket> findByStatusAndClassroomSubjectId(
            @Param("status") SupportTicketStatus status,
            @Param("classroomSubjectId") Long classroomSubjectId
    );
}
