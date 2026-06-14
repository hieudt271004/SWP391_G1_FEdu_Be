package com.fedu.fedu.dto.res;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoResponse {
    private Long videoId;
    private String videoUrl;
    private String title;
    private Integer durationSeconds;
    private String description;
}
