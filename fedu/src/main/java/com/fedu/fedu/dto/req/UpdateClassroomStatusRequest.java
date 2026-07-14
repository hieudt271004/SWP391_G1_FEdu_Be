package com.fedu.fedu.dto.req;

import com.fedu.fedu.utils.enums.ClassroomStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Body cho endpoint đổi riêng trạng thái lớp học (bắt đầu / kết thúc). */
@Data
public class UpdateClassroomStatusRequest {

    @NotNull(message = "Trạng thái lớp học là bắt buộc")
    private ClassroomStatus status;
}
