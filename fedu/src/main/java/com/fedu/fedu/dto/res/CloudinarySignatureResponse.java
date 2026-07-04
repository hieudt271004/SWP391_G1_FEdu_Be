package com.fedu.fedu.dto.res;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CloudinarySignatureResponse {
    private String cloudName;
    private String apiKey;
    private long timestamp;
    private String signature;
    private String folder;
}
