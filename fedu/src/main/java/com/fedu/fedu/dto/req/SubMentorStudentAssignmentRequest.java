package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Yêu cầu tạo bản ghi SubMentorStudentAssignment:
 * sub-mentor CSS kèm một student CSS trong cùng lớp-môn.
 */
@Data
public class SubMentorStudentAssignmentRequest {

    /** ID bản ghi ClassroomSubjectStudent của học sinh đóng vai sub-mentor (phải có isSubmentor=true). */
    @NotNull(message = "subMentorCssId không được để trống")
    private Long subMentorCssId;

    /** ID bản ghi ClassroomSubjectStudent của học sinh được kèm. */
    @NotNull(message = "studentCssId không được để trống")
    private Long studentCssId;
}
