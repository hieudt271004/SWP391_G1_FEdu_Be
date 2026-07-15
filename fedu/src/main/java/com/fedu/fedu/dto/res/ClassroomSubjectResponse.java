package com.fedu.fedu.dto.res;

import com.fedu.fedu.utils.enums.ClassroomStatus;
import com.fedu.fedu.utils.enums.Term;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ClassroomSubjectResponse {
    private Long classroomSubjectId;
    private Long classroomId;
    private String className;
    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    private Long lecturerId;
    private String lecturerName;
    private String displayName;
    private int studentCount;
    private Boolean isSubmentor;

    /** Trạng thái + "Kì học" của lớp cha — để list phía giảng viên hiển thị đúng thay vì bịa. */
    private ClassroomStatus status;
    private String term;
    private Integer academicYear;
    private String semesterLabel;
}