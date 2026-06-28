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

    // Optional fields for video material type
    private String videoUrl;
    private String videoTitle;
    private Integer videoDuration;
    private String videoDescription;

    // Optional fields for downloadable file material type
    private String fileUrl;
    private String fileName;
    private String fileType;
    private String fileDescription;
    // Cloudinary: id asset + resource_type (để quản lý vòng đời file)
    private String publicId;
    private String resourceType;
}
