package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    private String name;

    @NotBlank(message = "Địa chỉ email không được để trống")
    @Email(message = "Địa chỉ email không hợp lệ")
    private String email;

    @NotBlank(message = "Tiêu đề không được để trống")
    private String subject;

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    private String message;
}
