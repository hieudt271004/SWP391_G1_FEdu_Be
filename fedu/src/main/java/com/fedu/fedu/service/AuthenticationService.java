package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.ResetPasswordDTO;
import com.fedu.fedu.dto.req.SignInRequest;
import com.fedu.fedu.dto.res.TokenResponse;
import com.fedu.fedu.dto.res.UserResponse;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.entity.Token;
import com.fedu.fedu.entity.UserAccount;
import io.micrometer.common.util.StringUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.fedu.fedu.utils.enums.TokenType.*;

import com.fedu.fedu.dto.req.GoogleLoginRequest;
import com.fedu.fedu.entity.UserRole;
import com.fedu.fedu.repository.RoleRepository;
import com.fedu.fedu.repository.UserAccountRepository;
import com.fedu.fedu.repository.UserRoleRepository;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.Collections;
import java.util.UUID;
import com.fedu.fedu.utils.enums.UserStatus;
import com.fedu.fedu.entity.Role;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final UserAccountService userService;
    private final MailService mailService;
    private final JwtService jwtService;
    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;

    public TokenResponse accessToken(SignInRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        UserAccount user = userService.getByEmail(req.getEmail());
        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        tokenService.saveLoginTokens(user, accessToken, refreshToken);
        return TokenResponse.builder()
                .accessToken(accessToken).refreshToken(refreshToken).userId(user.getUserId()).build();
    }

    public TokenResponse refreshToken(HttpServletRequest request) {
        log.info("---------- refreshToken ----------");

        final String refreshToken = request.getHeader("x-refresh-token");
        if (StringUtils.isBlank(refreshToken)) {
            throw new InvalidDataException("Refresh token must be not blank");
        }
        final String userName = jwtService.extractUsername(refreshToken, REFRESH_TOKEN);
        var user = userService.getByEmail(userName);
        if (!jwtService.isValid(refreshToken, REFRESH_TOKEN, user)) {
            throw new InvalidDataException("Not allow access with this token");
        }

        String accessToken = jwtService.generateToken(user);

        tokenService.saveLoginTokens(user, accessToken, refreshToken);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getUserId())
                .build();
    }


    public String removeToken(HttpServletRequest request) {
        log.info("---------- removeToken ----------");

        final String token = request.getHeader("x-refresh-token");
        if (StringUtils.isBlank(token)) {
            throw new InvalidDataException(" Refresh token must be not blank");
        }

        
        final String userName = jwtService.extractUsername(token, REFRESH_TOKEN);

        
        tokenService.delete(userName);

        return "Removed!";
    }

    public void forgotPassword(String email) {
        log.info("---------- forgotPassword ----------");

        UserAccount user = userService.getByEmail(email);

        String resetToken = jwtService.generateResetToken(user);

        tokenService.saveResetToken(user, resetToken);

        try {
            mailService.sendConfirmLink(email, resetToken);
        } catch (Exception e) {
            log.error("Send email fail, errorMessage={}", e.getMessage());
            throw new InvalidDataException("Send email fail, please try again!");
        }
    }

    public String resetPassword(String secretKey) {
        UserAccount user = validateToken(secretKey);
        Token tokenEntity = tokenService.getByEmail(user.getEmail());
        if (tokenEntity.getResetToken() == null || !tokenEntity.getResetToken().equals(secretKey)) {
            throw new InvalidDataException("Reset token không hợp lệ hoặc đã được sử dụng");
        }
        return "Reset token hợp lệ";
    }

    public String changePassword(ResetPasswordDTO request) {
        log.info("---------- changePassword ----------");

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new InvalidDataException("Passwords do not match");
        }

        
        UserAccount user = validateToken(request.getSecretKey());

        Token tokenEntity = tokenService.getByEmail(user.getEmail());
        if(tokenEntity == null
                || tokenEntity.getResetToken() == null
                || !tokenEntity.getResetToken().equals(request.getSecretKey())){
            throw new InvalidDataException("Reset token không hợp lệ đã được sử dụng");
        }
        
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userService.save(user);

        tokenService.clearResetToken(user.getEmail());

        return "Changed";
    }

    
    private UserAccount validateToken(String token) {
        final String userName;
        try{
            userName = jwtService.extractUsername(token, RESET_TOKEN);
        }catch (Exception e){
            throw new InvalidDataException("Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ");
        }

        var user = userService.getByEmail(userName);
        if (!user.isEnabled()) {
            throw new InvalidDataException("User not active");
        }
        return user;
    }

    @org.springframework.transaction.annotation.Transactional
    public TokenResponse googleLogin(GoogleLoginRequest request) {
        log.info("---------- googleLogin ----------");

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(request.getCredential());
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response;
        try {
            response = restTemplate.exchange(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    HttpMethod.GET, entity, Map.class);
        } catch (Exception e) {
            log.error("Failed to verify Google access_token: {}", e.getMessage());
            throw new InvalidDataException("Google access_token không hợp lệ");
        }

        Map<?, ?> googleUser = response.getBody();
        if (googleUser == null || googleUser.get("email") == null) {
            throw new InvalidDataException("Không lấy được thông tin từ Google");
        }

        String email = (String) googleUser.get("email");
        log.info("Google verified email: {}", email);

        final Map<?, ?> googleUserFinal = googleUser;
        UserAccount user = userAccountRepository.findByEmail(email)
                .orElseGet(() -> createGoogleUser(googleUserFinal));

        if (!user.isEnabled()) {
            throw new InvalidDataException("Tài khoản đã bị vô hiệu hóa");
        }

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        tokenService.saveLoginTokens(user, accessToken, refreshToken);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getUserId())
                .build();
    }

    private UserAccount createGoogleUser(Map<?, ?> googleUser) {
        String email = (String) googleUser.get("email");
        log.info("Creating new Google user for email: {}", email);

        
        String givenName  = (String) googleUser.get("given_name");
        String familyName = (String) googleUser.get("family_name");
        String picture    = (String) googleUser.get("picture");
        String fallbackName = email.split("@")[0];

        UserAccount userAccount = UserAccount.builder()
                .email(email)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .status(UserStatus.ACTIVE)
                .firstName(givenName  != null && !givenName.isBlank()  ? givenName  : fallbackName)
                .lastName (familyName != null && !familyName.isBlank() ? familyName : "")
                .avatarUrl(picture)
                .isDeleted(false)
                .build();
        userAccount = userAccountRepository.save(userAccount);

        Role defaultRole = roleRepository.findByRoleName(com.fedu.fedu.utils.enums.UserRole.STUDENT)
                .orElseThrow(() -> new IllegalStateException("Default role STUDENT not found"));

        UserRole userRole = UserRole.builder()
                .userAccount(userAccount)
                .role(defaultRole)
                .build();
        userRoleRepository.save(userRole);
        userAccount.setUserRoles(Collections.singletonList(userRole));

        return userAccount;
    }

    public UserResponse getCurrentUser() {
        String email = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        UserAccount user = userService.getByEmail(email);

        List<String> roles = userService.getAllRoleByEmail(user.getUserId());

        return UserResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .avatarUrl(user.getAvatarUrl())
                .roles(roles)
                .status(user.getStatus())
                .gender(user.getGender())
                .bod(user.getBod())
                .phone(user.getPhone())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}