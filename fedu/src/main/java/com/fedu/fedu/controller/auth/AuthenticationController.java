package com.fedu.fedu.controller.auth;

import com.fedu.fedu.dto.req.RegisterRequest;
import com.fedu.fedu.dto.req.ResetPasswordDTO;
import com.fedu.fedu.dto.req.SignInRequest;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.ResponseError;
import com.fedu.fedu.dto.res.TokenResponse;
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
import com.fedu.fedu.dto.req.GoogleLoginRequest;

@Slf4j
@Validated
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication Controller")
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final UserAccountService userAccountService;

    //register user
    @Operation(method = "POST", summary = "Save new user account", description = "Send a request to register new user")
    @PostMapping("/register")
    public ResponseData<Void> registerUser(@Valid @RequestBody RegisterRequest request) {
        try {
            userAccountService.save(request);
            return new ResponseData<>(HttpStatus.CREATED.value(), "User registered successfully");
        } catch (Exception e) {
            log.error("Failed to register user: {}", e.getMessage(), e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), e.getMessage());
        }
    }

    //login - create token
    @Operation(method = "POST", summary = "Login", description = "Allow user login get access token")
    @PostMapping("/login")
    public ResponseData<TokenResponse> accessToken(@Valid @RequestBody SignInRequest request) {
        try {
            return new ResponseData<>(HttpStatus.OK.value(), "User login", authenticationService.accessToken(request));
        } catch (Exception e) {
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Unexpected error: " + e.getMessage());
        }
    }

    @Operation(method = "POST", summary = "Login with Google", description = "Xác minh access_token Google và trả về JWT hệ thống")
    @PostMapping("/google-login")
    public ResponseData<TokenResponse> googleLogin(@RequestBody GoogleLoginRequest request) {
        try {
            return new ResponseData<>(HttpStatus.OK.value(), "Google login success", authenticationService.googleLogin(request));
        } catch (Exception e) {
            log.error("Google login failed", e);
            String msg = (e.getMessage() != null) ? e.getMessage() : e.getClass().getSimpleName();
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), msg);
        }
    }

    //refresh token
    @PostMapping("/refresh-token")
    public ResponseData<TokenResponse> refreshToken(HttpServletRequest request) {
        authenticationService.refreshToken(request);
        return new ResponseData<>(HttpStatus.OK.value(), "Success");
    }

    //log out remove token
    @PostMapping("/log-out")
    public ResponseData<String> removeToken(HttpServletRequest request) {
        authenticationService.removeToken(request);
        return new ResponseData<>(HttpStatus.OK.value(), "Success");
    }

    @PostMapping("/forgot-password")
    public ResponseData<String> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if(email == null || email.isBlank()){
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Email không được để trống");
        }
        try {
            authenticationService.forgotPassword(email);
        }catch (Exception e){
            log.warn("forgotPassword failed for email={}: {}", email, e.getMessage());
        }
        return new ResponseData<>(HttpStatus.OK.value(),
                "Nếu email tồn tại trong hệ thống, một đường dẫn đặt lại mật khẩu đã được gửi.");
    }

    @GetMapping("/reset-password")
    public ResponseData<String> resetPassword(HttpServletRequest request) {
        try {
            String secretKey = request.getHeader("X-Secret-Key");
            if (secretKey == null || secretKey.isBlank()) {
                return new ResponseData<>(HttpStatus.BAD_REQUEST.value(), "Missing or invalid secret key");
            }

            String response = authenticationService.resetPassword(secretKey);
            return new ResponseData<>( HttpStatus.OK.value(), response);
        } catch (Exception e) {
            log.error("Error during password reset: ", e);
            return new ResponseData<>(HttpStatus.BAD_REQUEST.value(), "Failed to reset password");
        }
    }

    @PostMapping("/change-password")
    public ResponseData<String> changePassword(@RequestBody @Valid ResetPasswordDTO request) {
        try {
            String response = authenticationService.changePassword(request);
            return new ResponseData<>(HttpStatus.OK.value(), "Password changed successfully", response);
        } catch (Exception e) {
            log.error("Lỗi khi đổi mật khẩu: ", e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), e.getMessage());
        }
    }
}
