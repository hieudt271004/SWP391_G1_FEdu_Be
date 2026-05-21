package com.fedu.fedu.controller;

import com.fedu.fedu.dto.UserCreateDTO;
import com.fedu.fedu.dto.UserRegisterDTO;
import com.fedu.fedu.dto.UserStatusSetDTO;
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
import jakarta.mail.MessagingException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.coyote.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.io.UnsupportedEncodingException;

import static org.springframework.http.HttpStatus.OK;

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

    private static final String API_KEY = "api-key";

    //register user
    @Operation(method = "POST", summary = "Save user account and forward to user service ", description = "Send a request to register new user")
    @PostMapping("/register")
    public ResponseData<Void> registerUser(@RequestBody RegisterRequest request) {
        try {
            userAccountService.save(request);
            return new ResponseData<>(HttpStatus.CREATED.value(), "User registered successfully");
        } catch (Exception e) {
            log.error("Failed to register user: {}", e.getMessage(), e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), e.getMessage());
        }
    }

    //get user from user service and save new user to db
    @Operation(method = "POST", summary = "Get user from user service and save new user to db ", description = "Get new user")
    @PostMapping(value = "/add")
    public ResponseData<Void> addUser(@RequestBody UserCreateDTO userCreateDTO) {
        try {
            userAccountService.createUser(userCreateDTO);
            return new ResponseData<>(HttpStatus.CREATED.value(), "User added successfully");
        } catch (Exception e) {
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Unexpected error: " + e.getMessage());
        }

    }

    //login - create token
    @Operation(method = "POST", summary = "Login", description = "Login")
    @PostMapping("/login")
    public ResponseData<TokenResponse> accessToken(@RequestBody SignInRequest request) {
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
    public ResponseEntity<TokenResponse> refreshToken(HttpServletRequest request) {
        return new ResponseEntity<>(authenticationService.refreshToken(request), OK);
    }

    @Operation(summary = "Delete user permanently", description = "Handle deletion of user")
    @DeleteMapping("/delete")
    public ResponseData<Void> deleteUser(@RequestBody String username) {
        try {
            userAccountService.deleteByEmail(username);
            return new ResponseData<>(HttpStatus.OK.value(), "User deleted successfully");
        } catch (Exception e) {
            log.error("Failed to delete user: {}", e.getMessage(), e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Failed to delete user");
        }
    }

    @Operation(summary = "Change status of user", description = "Send a request to change status of user")
    @PatchMapping("/status")
    public ResponseData<Void> updateStatus(@RequestBody UserStatusSetDTO userStatusSetDTO) {
        try {
            userAccountService.changeUserStatus(userStatusSetDTO.getUserName(), userStatusSetDTO.getStatus());
            return new ResponseData<>(HttpStatus.ACCEPTED.value(), "update user status success");
        } catch (Exception e) {
            log.info("{}", e.getMessage(), e.getCause());
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "update user status failed");
        }
    }

    //log out remove token
    @PostMapping("/log-out")
    public ResponseEntity<String> removeToken(HttpServletRequest request) {
        return new ResponseEntity<>(authenticationService.removeToken(request), OK);
    }

    @PostMapping("/forgot-password")
    public ResponseData<String> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String resetToken = authenticationService.forgotPassword(email);
        return new ResponseData<>(HttpStatus.OK.value(), "Gửi email thành công", resetToken);
    }

    @GetMapping("/reset-password")
    public ResponseEntity<String> resetPassword(HttpServletRequest request) {
        try {
            String secretKey = request.getHeader("X-Secret-Key");
            if (secretKey == null || secretKey.isBlank()) {
                return new ResponseEntity<>("Missing or invalid secret key", HttpStatus.BAD_REQUEST);
            }

            String response = authenticationService.resetPassword(secretKey);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error during password reset: ", e);
            return new ResponseEntity<>("Failed to reset password", HttpStatus.BAD_REQUEST);
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
