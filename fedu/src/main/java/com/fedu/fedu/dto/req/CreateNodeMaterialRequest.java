package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNodeMaterialRequest {
    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;
    private Boolean required;

    
    private String videoUrl;
    private String videoTitle;
    private Integer videoDuration;
    private String videoDescription;

    
    private String fileUrl;
    private String fileName;
    private String fileType;
    private String fileDescription;
    
    private String publicId;
    private String resourceType;
}
