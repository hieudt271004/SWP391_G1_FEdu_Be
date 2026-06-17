package com.fedu.fedu.controller.auth;

import com.fedu.fedu.dto.req.*;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.ResponseError;
import com.fedu.fedu.dto.res.TokenResponse;
import com.fedu.fedu.dto.res.UserResponse;
import com.fedu.fedu.service.AuthenticationService;
import com.fedu.fedu.service.UserAccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Slf4j
@Validated
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication Controller")
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final UserAccountService userAccountService;

    @Operation(method = "POST", summary = "Save new user account", description = "Send a request to register new user")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/register")
    public ResponseData<Void> registerUser(@Valid @RequestBody RegisterRequest request) {
        userAccountService.save(request);
        return new ResponseData<>(HttpStatus.CREATED.value(), "User registered successfully");
    }

    @Operation(method = "POST", summary = "Login", description = "Allow user login get access token")
    @PostMapping("/login")
    public ResponseData<TokenResponse> accessToken(@Valid @RequestBody SignInRequest request) {
        return new ResponseData<>(HttpStatus.OK.value(), "User login",
                authenticationService.accessToken(request));
    }

    @Operation(method = "GET", summary = "Get current user info",
            description = "Return user info based on JWT token in Authorization header")
    @GetMapping("/me")
    public ResponseData<UserResponse> getCurrentUser() {
        UserResponse user = authenticationService.getCurrentUser();
        return new ResponseData<>(HttpStatus.OK.value(), "Success", user);
    }

    @Operation(method = "POST", summary = "Login with Google", description = "Xác minh access_token Google và trả về JWT hệ thống")
    @PostMapping("/google-login")
    public ResponseData<TokenResponse> googleLogin(@RequestBody GoogleLoginRequest request) {
        return new ResponseData<>(HttpStatus.OK.value(), "Google login success",
                authenticationService.googleLogin(request));
    }

    @Operation(method = "POST", summary = "Refresh access token", description = "Đọc refresh token từ header x-refresh-token")
    @PostMapping("/refresh-token")
    public ResponseData<TokenResponse> refreshToken(HttpServletRequest request) {
        return new ResponseData<>(HttpStatus.OK.value(), "Token refreshed",
                authenticationService.refreshToken(request));
    }

    @PostMapping("/log-out")
    public ResponseData<String> removeToken(HttpServletRequest request) {
        authenticationService.removeToken(request);
        return new ResponseData<>(HttpStatus.OK.value(), "Logged out successfully");
    }

    @PostMapping("/forgot-password")
    public ResponseData<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest body) {
        try {
            authenticationService.forgotPassword(body.getEmail());
        } catch (Exception e) {
            log.warn("forgotPassword failed for email={}: {}", body.getEmail(), e.getMessage());
        }
        return new ResponseData<>(HttpStatus.OK.value(),
                "Nếu email tồn tại trong hệ thống, một đường dẫn đặt lại mật khẩu đã được gửi.");
    }

    @GetMapping("/reset-password")
    public ResponseData<String> resetPassword(@RequestHeader("X-Secret-Key") String secretKey) {
        return new ResponseData<>(HttpStatus.OK.value(), authenticationService.resetPassword(secretKey));
    }

    @Operation(summary = "Validate reset password token")
    @PostMapping("/change-password")
    public ResponseData<String> changePassword(@RequestBody @Valid ResetPasswordDTO request) {
        String response = authenticationService.changePassword(request);
        return new ResponseData<>(HttpStatus.OK.value(), "Password changed successfully", response);
    }

    @PostMapping("/reset-all-passwords")
    public ResponseData<Void> resetAllPasswords() {
        userAccountService.resetAllPasswordsTo123456();
        return new ResponseData<>(HttpStatus.OK.value(), "All passwords reset to 123456 successfully");
    }

    @Operation(summary = "Setup default admin account", description = "Create admin@gmail.com with password 123456 and role ADMIN")
    @PostMapping("/setup-admin")
    public ResponseData<Void> setupAdmin() {
        userAccountService.createDefaultAdmin();
        return new ResponseData<>(HttpStatus.OK.value(), "Default admin user set up successfully");
    }
}