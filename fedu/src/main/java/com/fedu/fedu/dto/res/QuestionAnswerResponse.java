package com.fedu.fedu.dto.res;

import lombok.*;

import java.time.LocalDateTime;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionAnswerResponse {
    private Long answerId;
    private Long questionId;
    private String content;
    private Long lecturerId;
    private String lecturerName;
    private String lecturerAvatarUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
