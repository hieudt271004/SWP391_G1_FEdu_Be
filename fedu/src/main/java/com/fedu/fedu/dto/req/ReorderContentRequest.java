package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReorderContentRequest {
    @NotNull(message = "ID không được để trống")
    private Long id;

    @NotBlank(message = "Loại nội dung không được để trống")
    private String type; // "MATERIAL", "TEST" or "EXERCISE"

    @NotNull(message = "Thứ tự không được để trống")
    private Integer orderIndex;
}
