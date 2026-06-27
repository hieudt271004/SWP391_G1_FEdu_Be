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

    /** Lấy tất cả ticket của một CSS (học sinh tạo). */
    List<SupportTicket> findByClassroomSubjectStudent_IdAndIsDeletedFalse(Long classroomSubjectStudentId);

    /**
     * Lấy ticket của các student-CSS mà sub-mentor đang phụ trách.
     * Dùng để hiển thị danh sách ticket cần xử lý cho sub-mentor.
     */
    @Query("""
        SELECT t FROM SupportTicket t
        WHERE t.classroomSubjectStudent.id IN :studentCssIds
          AND t.isDeleted = false
        ORDER BY t.createdAt DESC
        """)
    List<SupportTicket> findByStudentCssIds(@Param("studentCssIds") List<Long> studentCssIds);

    /**
     * Lấy ticket SEND của tất cả lớp-môn mà giảng viên phụ trách.
     * Dùng để hiển thị danh sách ticket leo thang cho giảng viên.
     */
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
