package com.fedu.fedu.dto.req;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

/** Giáo viên chấm đúng/sai các câu TỰ LUẬN của một lượt làm bài (attempt PENDING_REVIEW). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeEssayRequest {

    @Valid
    @NotEmpty(message = "Danh sách chấm không được rỗng")
    private List<EssayGrade> grades;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EssayGrade {
        @NotNull(message = "responseId không được để trống")
        private Long responseId;

        @NotNull(message = "isCorrect không được để trống")
        private Boolean isCorrect;
    }
}
