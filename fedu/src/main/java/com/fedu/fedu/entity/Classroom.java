package com.fedu.fedu.entity;

import com.fedu.fedu.utils.ClassroomStatusConverter;
import com.fedu.fedu.utils.enums.ClassroomStatus;
import com.fedu.fedu.utils.enums.Term;
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

    @Column(name = "term", length = 20)
    private String term;

    /** "Kì học" tách cấu trúc: năm học, ví dụ 2024. */
    @Column(name = "academic_year")
    private Integer academicYear;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @Convert(converter = ClassroomStatusConverter.class)
    @Column(name = "status", nullable = false, length = 50)
    private ClassroomStatus status = ClassroomStatus.INACTIVE;

    @Builder.Default
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    /** Nhãn "Kì học" hiển thị, ví dụ "Fall 2024" (null nếu chưa đặt học kỳ). Không map cột. */
    @Transient
    public String semesterLabel() {
        if (term == null) {
            return null;
        }
        String label = term;
        if ("SPRING".equalsIgnoreCase(term)) label = "Spring";
        else if ("SUMMER".equalsIgnoreCase(term)) label = "Summer";
        else if ("FALL".equalsIgnoreCase(term)) label = "Fall";
        return academicYear != null ? label + " " + academicYear : label;
    }
}
