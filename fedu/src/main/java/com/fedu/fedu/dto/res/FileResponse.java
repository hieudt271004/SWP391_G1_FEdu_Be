package com.fedu.fedu.dto.res;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileResponse {
    private Long fileId;
    private String fileUrl;
    private String fileName;
    private String fileType;
    private String description;
}
