package com.fedu.fedu.dto.res;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttemptStartResponse {
    private Long attemptId;
    private LocalDateTime startedAt;
    private Integer durationMinutes;

    /**
     * Số giây còn lại do máy chủ tính, để client đếm ngược theo mốc của server thay vì
     * đồng hồ trình duyệt. null = đề không giới hạn thời gian (không hiện đồng hồ).
     */
    private Long remainingSeconds;

    private String status;
    private Integer tabOutCount;
}
