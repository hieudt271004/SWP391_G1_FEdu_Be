package com.fedu.fedu.controller;

import com.fedu.fedu.dto.req.UserProfileRequest;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.UserResponse;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.service.UserAccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Slf4j
@Validated
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@Tag(name = "User Profile Controller", description = "APIs for managing user profile")
public class UserProfileController {

    private final UserAccountService userAccountService;

    @Operation(summary = "Get current user profile", 
               description = "Get profile information of currently logged-in user")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/profile")
    public ResponseData<UserResponse> getMyProfile(@AuthenticationPrincipal UserAccount currentUser) {
        log.info("Request get profile for user: {}", currentUser.getEmail());
        UserResponse response = userAccountService.getProfile(currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Get profile successfully", response);
    }

    @Operation(summary = "Update current user profile", 
               description = "Update profile information (firstName, lastName, phone, gender, bod, avatarUrl)")
    @PreAuthorize("isAuthenticated()")
    @PutMapping("/profile")
    public ResponseData<UserResponse> updateMyProfile(
            @AuthenticationPrincipal UserAccount currentUser,
            @Valid @RequestBody UserProfileRequest request) {
        log.info("Request update profile for user: {}", currentUser.getEmail());
        UserResponse response = userAccountService.updateProfile(currentUser.getUserId(), request);
        return new ResponseData<>(HttpStatus.OK.value(), "Profile updated successfully", response);
    }

    @Operation(summary = "Get user profile by ID (Admin only)", 
               description = "Admin can view any user's profile")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/profile/{userId}")
    public ResponseData<UserResponse> getUserProfile(@PathVariable long userId) {
        log.info("Request get profile for userId: {}", userId);
        UserResponse response = userAccountService.getProfile(userId);
        return new ResponseData<>(HttpStatus.OK.value(), "Get profile successfully", response);
    }
}
