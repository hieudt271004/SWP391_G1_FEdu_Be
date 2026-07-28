package com.fedu.fedu.dto.req;

import com.fedu.fedu.utils.enums.Term;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

/**
 * Thông tin lớp học (tạo/sửa). Trạng thái vòng đời KHÔNG nằm ở đây —
 * chỉ đổi qua PATCH /classrooms/{id}/status (admin).
 */
@Data
@Builder
public class ClassroomRequest {

    @NotBlank(message = "Class name is required")
    private String className;

    /** "Kì học": học kỳ (SPRING/SUMMER/FALL). */
    private String term;

    /** "Kì học": năm học, ví dụ 2024. */
    private Integer academicYear;

    private String description;
}
