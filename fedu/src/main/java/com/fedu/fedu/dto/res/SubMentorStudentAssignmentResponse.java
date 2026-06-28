package com.fedu.fedu.dto.res;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Phản hồi thông tin một bản ghi SubMentorStudentAssignment. Không lộ entity.
 */
@Data
@Builder
public class SubMentorStudentAssignmentResponse {

    private Long id;

    /** ID CSS của sub-mentor. */
    private Long subMentorCssId;

    /** Tên hiển thị của sub-mentor. */
    private String subMentorName;

    /** Email của sub-mentor. */
    private String subMentorEmail;

    /** ID CSS của học sinh được kèm. */
    private Long studentCssId;

    /** Tên hiển thị của học sinh được kèm. */
    private String studentName;

    /** Email của học sinh được kèm. */
    private String studentEmail;

    private LocalDateTime assignedAt;
}
