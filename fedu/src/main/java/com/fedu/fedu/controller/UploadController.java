package com.fedu.fedu.controller;

import com.fedu.fedu.dto.res.CloudinarySignatureResponse;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.service.CloudinaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/upload")
@RequiredArgsConstructor
@Tag(name = "Upload Controller", description = "Cấp chữ ký để client upload trực tiếp lên Cloudinary")
public class UploadController {

    private final CloudinaryService cloudinaryService;

    @Operation(summary = "Lấy chữ ký upload trực tiếp lên Cloudinary (mọi user đã đăng nhập)")
    @GetMapping("/cloudinary-signature")
    public ResponseData<CloudinarySignatureResponse> cloudinarySignature(
            @RequestParam(required = false) String folder) {
        return new ResponseData<>(HttpStatus.OK.value(), "OK", cloudinaryService.signUpload(folder));
    }
}
