package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.UserCreateRequest;
import com.fedu.fedu.dto.req.RegisterRequest;
import com.fedu.fedu.dto.req.SignInRequest;
import com.fedu.fedu.entity.LoginHistory;
import com.fedu.fedu.entity.Role;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.entity.UserRole;
import com.fedu.fedu.repository.LoginHistoryRepository;
import com.fedu.fedu.repository.RoleRepository;
import com.fedu.fedu.repository.UserAccountRepository;
import com.fedu.fedu.repository.UserRoleRepository;
import com.fedu.fedu.service.UserAccountService;
import com.fedu.fedu.utils.enums.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Slf4j
@RequiredArgsConstructor
@Service
public class UserAccountServiceImpl implements UserAccountService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final LoginHistoryRepository loginHistoryRepository;

    @Override
    public UserAccount getByEmail(String email) {
        return userAccountRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Not found email: " + email));
    }

    @Override
    public void changeUserStatus(String username, UserStatus status) {
        UserAccount userAccount = userAccountRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userAccount.setStatus(status);
        userAccountRepository.save(userAccount);
    }

    @Scheduled(cron = "0 0 0 * * *")
    public void updateExpirationAccount() {
        List<UserAccount> users = userAccountRepository.findAllByStatus(UserStatus.ACTIVE);
        for (UserAccount userAccount : users) {
            if (userAccount.getLoginHistory() != null) {
                LocalDateTime lastLogin = userAccount.getLoginHistory().getLastLogin();
                if (lastLogin != null && lastLogin.plusDays(14).isBefore(LocalDateTime.now())) {
                    userAccount.setStatus(UserStatus.INACTIVE);
                    userAccountRepository.save(userAccount);
                }
            }
        }
    }

    @Override
    public void verifyAccount(String email) {
        // Method logic
    }

    @Override
    public void deleteByEmail(String email) {
        UserAccount userAccount = userAccountRepository.findByEmail(email)
               .orElseThrow(() -> new RuntimeException("User not found"));
        userAccountRepository.delete(userAccount);
    }

    @Override
    public void registerUser(UserAccount userAccount) {
        LoginHistory loginHistory = new LoginHistory();
        loginHistory.setUserAccount(userAccount);
        loginHistory.setLastLogin(LocalDateTime.now());
        loginHistoryRepository.save(loginHistory);
    }

    @Override
    public void updateLastLogin(SignInRequest request) {
        String email = request.getEmail();
        UserAccount account = userAccountRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LoginHistory loginHistory = loginHistoryRepository.findByUserAccount(account)
                .orElseGet(() -> {
                    LoginHistory newHistory = new LoginHistory();
                    newHistory.setUserAccount(account);
                    return newHistory;
                });

        loginHistory.setLastLogin(LocalDateTime.now());
        loginHistoryRepository.save(loginHistory);
    }

    @Override
    public void createUser(UserCreateRequest userCreateDTO) {
        UserAccount userAccount = createUserAccount(userCreateDTO);
        saveNewLoginHistory(userAccount);
        assignUserRole(userAccount, userCreateDTO.getUserRole());
        userAccountRepository.save(userAccount);
    }

    private UserAccount createUserAccount(UserCreateRequest userCreateDTO) {
        String email = userCreateDTO.getEmail();
        String username = email != null && email.contains("@") ? email.split("@")[0] : "user";
        return UserAccount.builder()
                .email(userCreateDTO.getEmail())
                .password(passwordEncoder.encode(userCreateDTO.getPassword()))
                .status(UserStatus.ACTIVE)
                .firstName(username)
                .lastName("Created")
                .isDeleted(false)
                .build();
    }

    private void saveNewLoginHistory(UserAccount userAccount) {
        LoginHistory loginHistory = new LoginHistory();
        loginHistory.setUserAccount(userAccount);
        loginHistory.setLastLogin(LocalDateTime.now());
        loginHistoryRepository.save(loginHistory);
        userAccount.setLoginHistory(loginHistory);
    }

    private void assignUserRole(UserAccount userAccount, com.fedu.fedu.utils.enums.UserRole userRole) {
        // Mặc định USER nếu input null/invalid — KHÔNG bao giờ fallback về ADMIN
        com.fedu.fedu.utils.enums.UserRole targetRole =
                (userRole != null) ? userRole : com.fedu.fedu.utils.enums.UserRole.USER;

        Role role = roleRepository.findByRoleName(targetRole)
                .orElseThrow(() -> new RuntimeException("Role not found: " + targetRole));

        UserRole userRoles = UserRole.builder()
                .role(role)
                .userAccount(userAccount)
                .build();

        userRoleRepository.save(userRoles);
        userAccount.setUserRoles(Collections.singletonList(userRoles));
    }

    @Override
    public void save(UserAccount userAccount) {
        userAccountRepository.save(userAccount);
    }

    @Override
    public void save(RegisterRequest request) {
        // chekc duplicate user
        if (userAccountRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        UserAccount userAccount = UserAccount.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .status(UserStatus.ACTIVE)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .isDeleted(false)
                .build();
        userAccountRepository.save(userAccount);

        Role defaultRole = roleRepository.findByRoleName(com.fedu.fedu.utils.enums.UserRole.USER)
                .orElseThrow(() -> new RuntimeException("Default role USER not found"));

        assignRoleToUser(userAccount, defaultRole);
        saveLoginHistory(userAccount);
    }

    private void assignRoleToUser(UserAccount userAccount, Role role) {
        UserRole userRole = UserRole.builder()
                .role(role)
                .userAccount(userAccount)
                .build();
        userRoleRepository.save(userRole);
        userAccount.setUserRoles(Collections.singletonList(userRole));
    }

    private void saveLoginHistory(UserAccount userAccount) {
        registerUser(userAccount);
    }

    @Override
    public boolean emailExist(String email) {
        return userAccountRepository.existsByEmail(email);
    }

    @Override
    public UserDetailsService userDetailService() {
        return username -> userAccountRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @Override
    public List<String> getAllRoleByEmail(long userId) {
        return userAccountRepository.findAllRoleByUserId(userId);
    }
}