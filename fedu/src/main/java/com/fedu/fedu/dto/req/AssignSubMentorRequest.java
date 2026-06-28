package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Yêu cầu bật/tắt cờ isSubmentor cho một học sinh trong lớp-môn.
 * Giảng viên gửi classroomSubjectStudentId (ID bản ghi CSS) hoặc studentId.
 */
@Data
public class AssignSubMentorRequest {

    /** ID bản ghi ClassroomSubjectStudent của học sinh cần bật/tắt cờ sub-mentor. */
    @NotNull(message = "classroomSubjectStudentId không được để trống")
    private Long classroomSubjectStudentId;
}
