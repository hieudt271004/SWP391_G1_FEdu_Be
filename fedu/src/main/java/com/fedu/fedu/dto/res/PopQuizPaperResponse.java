package com.fedu.fedu.dto.res;

import lombok.*;

import java.util.List;

/** Đề pop-quiz đã tráo thứ tự (seed = attemptId), không lộ cờ đáp án đúng. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PopQuizPaperResponse {
    private Long assignmentId;
    private Long attemptId;
    private String title;
    private Integer durationMinutes;
    private Long remainingSeconds;
    private List<QuestionResponse> questions;
}
