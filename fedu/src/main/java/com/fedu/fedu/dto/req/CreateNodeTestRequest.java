package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNodeTestRequest {
    @NotBlank(message = "Tiêu đề bài kiểm tra không được để trống")
    private String title;
    private String description;
    private Integer durationMinutes;
    private BigDecimal passingPercentage;
    /** true = soạn xong CHƯA phát cho học sinh (dùng ở buổi học live, chờ bấm "Phát đề"). */
    private Boolean holdRelease;
}
