package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Yêu cầu học sinh tạo ticket hỗ trợ trong một lớp-môn.
 */
@Data
public class CreateSupportTicketRequest {

    /** ID của lớp-môn học sinh muốn gửi câu hỏi. */
    @NotNull(message = "classroomSubjectId không được để trống")
    private Long classroomSubjectId;

    /** Nội dung câu hỏi. */
    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    private String messageStudent;
}
