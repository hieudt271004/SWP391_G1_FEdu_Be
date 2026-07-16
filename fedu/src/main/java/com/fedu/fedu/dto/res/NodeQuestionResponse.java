package com.fedu.fedu.dto.res;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NodeQuestionResponse {
    private Long questionId;
    private Long nodeId;
    private String content;
    private Long studentId;
    private String studentName;
    private String studentAvatarUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<QuestionAnswerResponse> answers;
}
