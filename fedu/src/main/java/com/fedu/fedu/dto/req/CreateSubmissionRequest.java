package com.fedu.fedu.dto.req;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSubmissionRequest {
    private String content;
    private String fileUrl;
}
