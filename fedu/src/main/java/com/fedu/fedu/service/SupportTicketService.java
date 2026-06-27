package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.CreateSupportTicketRequest;
import com.fedu.fedu.dto.req.RespondTicketRequest;
import com.fedu.fedu.dto.res.SupportTicketResponse;

import java.util.List;

/**
 * Quản lý support ticket theo mô hình peer-mentoring.
 * Phân quyền ở tầng dữ liệu: mọi nhánh từ chối throw exception phù hợp.
 */
public interface SupportTicketService {

    // ─── Student ──────────────────────────────────────────────────────────────

    /**
     * Học sinh tạo ticket trong lớp-môn mình ghi danh.
     *
     * @param request classroomSubjectId + messageStudent
     * @param studentUserId userId của học sinh gửi yêu cầu
     * @return thông tin ticket vừa tạo
     */
    SupportTicketResponse createTicket(CreateSupportTicketRequest request, Long studentUserId);

    // ─── Sub-mentor ───────────────────────────────────────────────────────────

    /**
     * Sub-mentor xem danh sách ticket của các học sinh được gán cho mình.
     * Chỉ trả ticket của CSS mà sub-mentor này phụ trách.
     *
     * @param subMentorUserId userId của người đang xem (phải có isSubmentor=true trong CSS đó)
     * @param classroomSubjectId lớp-môn cần lọc
     */
    List<SupportTicketResponse> listAssignedTickets(Long subMentorUserId, Long classroomSubjectId);

    /**
     * Sub-mentor trả lời một ticket NONE của học sinh được gán → chuyển thành DONE.
     *
     * @param ticketId ID ticket
     * @param request nội dung trả lời
     * @param subMentorUserId userId của sub-mentor
     */
    SupportTicketResponse respond(Long ticketId, RespondTicketRequest request, Long subMentorUserId);

    /**
     * Sub-mentor leo thang ticket lên giảng viên → chuyển thành SEND.
     * Bị từ chối nếu lớp-môn chưa có lecturer.
     *
     * @param ticketId ID ticket
     * @param subMentorUserId userId của sub-mentor
     */
    SupportTicketResponse escalate(Long ticketId, Long subMentorUserId);

    // ─── Teacher ──────────────────────────────────────────────────────────────

    /**
     * Giảng viên xem danh sách ticket SEND của lớp-môn mình phụ trách.
     *
     * @param classroomSubjectId ID lớp-môn
     * @param lecturerId userId của giảng viên
     */
    List<SupportTicketResponse> listEscalatedTickets(Long classroomSubjectId, Long lecturerId);

    /**
     * Giảng viên trả lời ticket SEND → chuyển thành DONE.
     *
     * @param ticketId ID ticket
     * @param request nội dung trả lời
     * @param lecturerId userId của giảng viên
     */
    SupportTicketResponse respondAsTeacher(Long ticketId, RespondTicketRequest request, Long lecturerId);
}
