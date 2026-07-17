package com.fedu.fedu.dto.res;

import com.fedu.fedu.utils.enums.RetakeRequestStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class RetakeRequestResponse {
    private Long id;
    private Long studentId;
    private String studentEmail;
    private String studentName;
    private Long classroomSubjectId;
    private String classroomSubjectName;
    private Long testId;
    private String testTitle;
    private RetakeRequestStatus status;
    private String requestReason;
    private String rejectReason;
    private LocalDateTime requestedAt;
    private LocalDateTime resolvedAt;
    private String resolvedByName;
}
