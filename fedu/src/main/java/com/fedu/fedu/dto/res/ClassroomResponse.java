package com.fedu.fedu.dto.res;

import com.fedu.fedu.utils.enums.ClassroomStatus;
import com.fedu.fedu.utils.enums.Term;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomResponse {
    private Long classroomId;
    private String className;

    /** "Kì học" tách cấu trúc. */
    private String term;
    private Integer academicYear;
    /** Nhãn hiển thị dựng sẵn cho FE, ví dụ "Fall 2024" (null nếu chưa đặt). */
    private String semesterLabel;

    private String description;
    private ClassroomStatus status;

    private int subjectCount;
    private int studentCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
