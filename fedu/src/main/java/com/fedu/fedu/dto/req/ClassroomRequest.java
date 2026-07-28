package com.fedu.fedu.dto.req;

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

    /** "Kì học": id của học kỳ đã cấu hình (bảng semesters). */
    private Long semesterId;

    private String description;
}
