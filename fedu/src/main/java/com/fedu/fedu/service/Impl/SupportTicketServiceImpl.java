package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.CreateSupportTicketRequest;
import com.fedu.fedu.dto.req.RespondTicketRequest;
import com.fedu.fedu.dto.res.SupportTicketResponse;
import com.fedu.fedu.entity.ClassroomSubject;
import com.fedu.fedu.entity.ClassroomSubjectStudent;
import com.fedu.fedu.entity.SupportTicket;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomSubjectRepository;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
import com.fedu.fedu.repository.SubMentorStudentAssignmentRepository;
import com.fedu.fedu.repository.SupportTicketRepository;
import com.fedu.fedu.service.SupportTicketService;
import com.fedu.fedu.utils.enums.SupportTicketStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupportTicketServiceImpl implements SupportTicketService {

    private final SupportTicketRepository ticketRepository;
    private final ClassroomSubjectStudentRepository cssRepository;
    private final ClassroomSubjectRepository classroomSubjectRepository;
    private final SubMentorStudentAssignmentRepository assignmentRepository;

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private SupportTicket requireTicket(Long ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ticket id: " + ticketId));
    }

    private ClassroomSubjectStudent requireStudentEnrolled(Long classroomSubjectId, Long studentUserId) {
        return cssRepository.findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentUserId)
                .orElseThrow(() -> new AccessDeniedException(
                        "Học sinh chưa ghi danh lớp-môn id=" + classroomSubjectId));
    }

    // ─── Student ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public SupportTicketResponse createTicket(CreateSupportTicketRequest request, Long studentUserId) {
        ClassroomSubjectStudent css = requireStudentEnrolled(request.getClassroomSubjectId(), studentUserId);

        // Nếu học sinh chưa được gán cho bất kỳ sub-mentor nào trong lớp-môn, gửi thẳng lên giảng viên (SEND)
        boolean hasSubmentor = !assignmentRepository.findByStudentCss_Id(css.getId()).isEmpty();
        SupportTicketStatus initialStatus = hasSubmentor ? SupportTicketStatus.NONE : SupportTicketStatus.SEND;

        SupportTicket ticket = SupportTicket.builder()
                .classroomSubjectStudent(css)
                .messageStudent(request.getMessageStudent())
                .status(initialStatus)
                .build();
        ticket = ticketRepository.save(ticket);
        log.info("Học sinh userId={} tạo ticket id={} trong lớp-môn id={}. Trạng thái khởi tạo: {}",
                studentUserId, ticket.getTicketId(), request.getClassroomSubjectId(), initialStatus);
        return toResponse(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupportTicketResponse> listMyTickets(Long studentUserId, Long classroomSubjectId) {
        ClassroomSubjectStudent css = requireStudentEnrolled(classroomSubjectId, studentUserId);
        return ticketRepository.findByClassroomSubjectStudent_IdAndIsDeletedFalseOrderByCreatedAtDesc(css.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ─── Sub-mentor ───────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<SupportTicketResponse> listAssignedTickets(Long subMentorUserId, Long classroomSubjectId) {
        // Xác nhận sub-mentor ghi danh lớp-môn và có cờ isSubmentor=true
        ClassroomSubjectStudent subMentorCss = requireStudentEnrolled(classroomSubjectId, subMentorUserId);
        if (!Boolean.TRUE.equals(subMentorCss.getIsSubmentor())) {
            throw new AccessDeniedException("Bạn không phải sub-mentor trong lớp-môn này");
        }

        List<Long> studentCssIds = assignmentRepository.findStudentCssIdsBySubMentorCssId(subMentorCss.getId());
        if (studentCssIds.isEmpty()) {
            return List.of();
        }
        return ticketRepository.findByStudentCssIds(studentCssIds)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SupportTicketResponse respond(Long ticketId, RespondTicketRequest request, Long subMentorUserId) {
        SupportTicket ticket = requireTicket(ticketId);
        Long classroomSubjectId = ticket.getClassroomSubjectStudent().getClassroomSubject().getId();

        // Xác nhận sub-mentor có cờ isSubmentor=true trong lớp-môn này
        ClassroomSubjectStudent subMentorCss = requireStudentEnrolled(classroomSubjectId, subMentorUserId);
        if (!Boolean.TRUE.equals(subMentorCss.getIsSubmentor())) {
            throw new AccessDeniedException("Bạn không phải sub-mentor trong lớp-môn này");
        }

        // Kiểm ticket thuộc nhóm kèm của sub-mentor này
        Long studentCssId = ticket.getClassroomSubjectStudent().getId();
        boolean isAssigned = assignmentRepository.existsBySubMentorCss_IdAndStudentCss_Id(
                subMentorCss.getId(), studentCssId);
        if (!isAssigned) {
            throw new AccessDeniedException("Ticket này không thuộc nhóm kèm của bạn");
        }

        if (ticket.getStatus() == SupportTicketStatus.DONE) {
            throw new InvalidDataException("Ticket này đã được giải quyết, không thể trả lời lại");
        }

        ticket.setMessageResponse(request.getMessageResponse());
        ticket.setStatus(SupportTicketStatus.DONE);
        ticket = ticketRepository.save(ticket);
        log.info("Sub-mentor userId={} trả lời ticket id={}", subMentorUserId, ticketId);
        return toResponse(ticket);
    }

    @Override
    @Transactional
    public SupportTicketResponse escalate(Long ticketId, Long subMentorUserId) {
        SupportTicket ticket = requireTicket(ticketId);
        ClassroomSubject cs = ticket.getClassroomSubjectStudent().getClassroomSubject();
        Long classroomSubjectId = cs.getId();

        // Xác nhận sub-mentor có cờ isSubmentor=true
        ClassroomSubjectStudent subMentorCss = requireStudentEnrolled(classroomSubjectId, subMentorUserId);
        if (!Boolean.TRUE.equals(subMentorCss.getIsSubmentor())) {
            throw new AccessDeniedException("Bạn không phải sub-mentor trong lớp-môn này");
        }

        // Kiểm ticket thuộc nhóm kèm
        Long studentCssId = ticket.getClassroomSubjectStudent().getId();
        boolean isAssigned = assignmentRepository.existsBySubMentorCss_IdAndStudentCss_Id(
                subMentorCss.getId(), studentCssId);
        if (!isAssigned) {
            throw new AccessDeniedException("Ticket này không thuộc nhóm kèm của bạn");
        }

        // Kiểm lớp-môn có lecturer (lecturer là NOT NULL trên ClassroomSubject nhưng phòng trường hợp null)
        if (cs.getLecturer() == null) {
            throw new InvalidDataException("Lớp-môn chưa có giảng viên phụ trách, không thể leo thang ticket");
        }

        if (ticket.getStatus() == SupportTicketStatus.DONE) {
            throw new InvalidDataException("Ticket đã được giải quyết, không thể leo thang");
        }

        ticket.setStatus(SupportTicketStatus.SEND);
        ticket = ticketRepository.save(ticket);
        log.info("Sub-mentor userId={} leo thang ticket id={} lên giảng viên", subMentorUserId, ticketId);
        return toResponse(ticket);
    }

    // ─── Teacher ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<SupportTicketResponse> listEscalatedTickets(Long classroomSubjectId, Long lecturerId) {
        ClassroomSubject cs = classroomSubjectRepository.findById(classroomSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp-môn id: " + classroomSubjectId));
        if (cs.getLecturer().getUserId() != lecturerId) {
            throw new AccessDeniedException("Bạn không phải giảng viên phụ trách lớp-môn này");
        }
        return ticketRepository
                .findByStatusAndClassroomSubjectId(SupportTicketStatus.SEND, classroomSubjectId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SupportTicketResponse respondAsTeacher(Long ticketId, RespondTicketRequest request, Long lecturerId) {
        SupportTicket ticket = requireTicket(ticketId);
        ClassroomSubject cs = ticket.getClassroomSubjectStudent().getClassroomSubject();

        if (cs.getLecturer().getUserId() != lecturerId) {
            throw new AccessDeniedException("Bạn không phải giảng viên phụ trách lớp-môn của ticket này");
        }

        if (ticket.getStatus() != SupportTicketStatus.SEND) {
            throw new InvalidDataException(
                    "Chỉ có thể trả lời ticket đã leo thang (SEND). Trạng thái hiện tại: " + ticket.getStatus());
        }

        ticket.setMessageResponse(request.getMessageResponse());
        ticket.setStatus(SupportTicketStatus.DONE);
        ticket = ticketRepository.save(ticket);
        log.info("Giảng viên userId={} trả lời ticket leo thang id={}", lecturerId, ticketId);
        return toResponse(ticket);
    }

    // ─── Mapper ───────────────────────────────────────────────────────────────

    private SupportTicketResponse toResponse(SupportTicket t) {
        var css = t.getClassroomSubjectStudent();
        var student = css.getStudent();
        return SupportTicketResponse.builder()
                .ticketId(t.getTicketId())
                .classroomSubjectStudentId(css.getId())
                .studentName(student.getLastName() + " " + student.getFirstName())
                .studentEmail(student.getEmail())
                .messageStudent(t.getMessageStudent())
                .messageResponse(t.getMessageResponse())
                .status(t.getStatus())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
