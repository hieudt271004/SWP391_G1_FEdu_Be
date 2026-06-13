package com.fedu.fedu.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AboutFeaturesResponse {
    private long totalPaths;
    private long totalMaterials;
    private long totalSubMentors;
    private long totalClassrooms;
    private long totalSubmissions;
    private long totalQuestions;

    private List<LearningPathDto> learningPaths;
    private List<ClassroomDto> classrooms;
    private List<MaterialDto> materials;
    private List<QuestionDto> questions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LearningPathDto {
        private Long pathId;
        private String pathName;
        private String subjectCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassroomDto {
        private Long classroomId;
        private String className;
        private String semester;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaterialDto {
        private Long materialId;
        private String title;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionDto {
        private Long questionId;
        private String content;
        private String studentName;
    }
}
