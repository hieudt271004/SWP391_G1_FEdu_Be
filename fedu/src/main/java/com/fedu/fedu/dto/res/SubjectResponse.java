package com.fedu.fedu.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fedu.fedu.entity.Subject;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectResponse {
    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    private String description;
    private String status;
    private Integer learningpathLength;

    public static SubjectResponse from(Subject s){
        return SubjectResponse.builder()
                .subjectId(s.getSubjectId())
                .subjectCode(s.getSubjectCode())
                .subjectName(s.getSubjectName())
                .description(s.getDescription())
                .status(s.getStatus())
                .learningpathLength(s.getLearningpathLength())
                .build();
    }
}
