package com.fedu.fedu.repository;

import com.fedu.fedu.entity.SupportTicket;
import com.fedu.fedu.utils.enums.TicketLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    
    @Query("SELECT st FROM SupportTicket st " +
           "WHERE st.classroomSubject.lecturer.userId = :lecturerId " +
           "AND st.supportLevel = :supportLevel " +
           "AND st.isDeleted = false " +
           "ORDER BY st.createdAt DESC")
    List<SupportTicket> findLecturerTickets(
            @Param("lecturerId") Long lecturerId, 
            @Param("supportLevel") TicketLevel supportLevel);
}
