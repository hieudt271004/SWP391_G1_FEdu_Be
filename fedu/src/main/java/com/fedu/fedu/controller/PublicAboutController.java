package com.fedu.fedu.controller;

import com.fedu.fedu.dto.req.ContactRequest;
import com.fedu.fedu.dto.res.AboutFeaturesResponse;
import com.fedu.fedu.dto.res.AboutStatsResponse;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.entity.Subject;
import com.fedu.fedu.service.PublicAboutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/public/about")
@RequiredArgsConstructor
@Tag(name = "Public About Controller")
public class PublicAboutController {

    private final PublicAboutService publicAboutService;

    @Operation(summary = "Get system statistics for public about page")
    @GetMapping("/stats")
    public ResponseData<AboutStatsResponse> getSystemStats() {
        log.info("Public request: get system stats");
        return new ResponseData<>(
                HttpStatus.OK.value(),
                "Retrieved system stats successfully",
                publicAboutService.getSystemStats()
        );
    }

    @Operation(summary = "Get active subjects list for public about page")
    @GetMapping("/subjects")
    public ResponseData<List<Subject>> getFeaturedSubjects() {
        log.info("Public request: get featured subjects");
        return new ResponseData<>(
                HttpStatus.OK.value(),
                "Retrieved featured subjects successfully",
                publicAboutService.getFeaturedSubjects()
        );
    }

    @Operation(summary = "Get system features statistics for public features page")
    @GetMapping("/features")
    public ResponseData<AboutFeaturesResponse> getFeaturesStats() {
        log.info("Public request: get features stats");
        return new ResponseData<>(
                HttpStatus.OK.value(),
                "Retrieved features stats successfully",
                publicAboutService.getFeaturesStats()
        );
    }

    @Operation(summary = "Submit contact message")
    @PostMapping("/contact")
    public ResponseData<Void> submitContact(@Valid @RequestBody ContactRequest contactRequest) {
        log.info("Public request: submit contact form - {}", contactRequest);
        publicAboutService.processContactMessage(contactRequest);
        return new ResponseData<>(
                HttpStatus.OK.value(),
                "Cảm ơn bạn đã liên hệ. Chúng tôi đã nhận được thông tin và sẽ phản hồi bạn trong thời gian sớm nhất.",
                null
        );
    }
}
