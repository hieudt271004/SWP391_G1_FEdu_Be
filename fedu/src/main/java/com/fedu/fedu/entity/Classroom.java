package com.fedu.fedu.entity;

import com.fedu.fedu.utils.ClassroomStatusConverter;
import com.fedu.fedu.utils.enums.ClassroomStatus;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "classrooms")
public class Classroom extends AbstractEntity<Long> {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "classroom_id")
    private Long classroomId;

    @Column(name = "class_name", nullable = false)
    private String className;

    /** "Kì học": FK tới học kỳ do admin cấu hình (thay cho 2 cột term + academic_year cũ). */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "semester_id")
    private Semester semester;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @Convert(converter = ClassroomStatusConverter.class)
    @Column(name = "status", nullable = false, length = 50)
    private ClassroomStatus status = ClassroomStatus.INACTIVE;

    @Builder.Default
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    /** term/academicYear giờ lấy từ semester đã liên kết — giữ getter để các nơi đọc cũ không phải đổi. */
    @Transient
    public String getTerm() {
        return semester != null ? semester.getTerm() : null;
    }

    @Transient
    public Integer getAcademicYear() {
        return semester != null ? semester.getAcademicYear() : null;
    }

    /** Nhãn "Kì học" hiển thị, ví dụ "Fall 2024" (null nếu chưa đặt học kỳ). Không map cột. */
    @Transient
    public String semesterLabel() {
        String term = getTerm();
        if (term == null) {
            return null;
        }
        String label = term;
        if ("SPRING".equalsIgnoreCase(term)) label = "Spring";
        else if ("SUMMER".equalsIgnoreCase(term)) label = "Summer";
        else if ("FALL".equalsIgnoreCase(term)) label = "Fall";
        Integer academicYear = getAcademicYear();
        return academicYear != null ? label + " " + academicYear : label;
    }
}
