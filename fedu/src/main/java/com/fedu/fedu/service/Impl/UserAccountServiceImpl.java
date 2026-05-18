package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.UserCreateDTO;
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

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
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
            LocalDate lastLogin = userAccount.getLoginHistory().getLastLogin();
            if (lastLogin.plusDays(14).isBefore(LocalDate.now())) {
                userAccount.setStatus(UserStatus.INACTIVE);
                userAccountRepository.save(userAccount);
            }
        }
    }

    //verify change and forgot password by token - extract token get email
    @Override
    public void verifyAccount(String email) {
        // Method logic
    }

    @Override
    public void deleteByEmail(String email) {
        UserAccount userAccount = userAccountRepository.findByEmail(email)
               .orElseThrow(() -> new RuntimeException("User not found"));
        //userAccount.setUserStatus(UserStatus.INACTIVE);
        userAccountRepository.delete(userAccount);
    }




    //save user login history
    @Override
    public void registerUser(UserAccount userAccount) {
        LoginHistory loginHistory = new LoginHistory();
        loginHistory.setUserAccount(userAccount);
        loginHistory.setLastLogin(LocalDate.now());
        loginHistoryRepository.save(loginHistory);
    }


    //update last login after every login
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

        loginHistory.setLastLogin(LocalDate.now());
        loginHistoryRepository.save(loginHistory);
    }


    //set user status after 15 days not active



    @Override
    public void createUser(UserCreateDTO userCreateDTO) {
        // Create user account
        UserAccount userAccount = createUserAccount(userCreateDTO);

        // Save new login history for user
        saveNewLoginHistory(userAccount);

        // Assign role based on user type
        assignUserRole(userAccount, userCreateDTO.getUserRole());

        // Save the updated user account with login history and roles
        userAccountRepository.save(userAccount);
    }

    private UserAccount createUserAccount(UserCreateDTO userCreateDTO) {
        return UserAccount.builder()
                .email(userCreateDTO.getEmail())
                .password(passwordEncoder.encode(userCreateDTO.getPassword()))
                .status(UserStatus.ACTIVE)
                .build();
    }

    private void saveNewLoginHistory(UserAccount userAccount) {
        LoginHistory loginHistory = new LoginHistory();
        loginHistory.setUserAccount(userAccount);
        loginHistory.setLastLogin(LocalDate.now());
        loginHistoryRepository.save(loginHistory);

        // Set the login history for the user account
        userAccount.setLoginHistory(loginHistory);
    }

    private void assignUserRole(UserAccount userAccount, com.fedu.fedu.utils.enums.UserRole userRole) {
        // Determine role ID based on user type
        Long roleId = (userRole == com.fedu.fedu.utils.enums.UserRole.TEACHER) ? 2L : 1L;
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Default role not found for role ID: " + roleId));

        UserRole userRoles = UserRole.builder()
                .role(role)
                .userAccount(userAccount)
                .build();

        // Save user role and assign it to user account
        userRoleRepository.save(userRoles);
        userAccount.setUserRoles(Collections.singletonList(userRoles));
    }

    @Override
    public void save(UserAccount userAccount) {
        userAccountRepository.save(userAccount);
    }

    @Override
    public void save(RegisterRequest request) {
        if (userAccountRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        UserAccount userAccount = createUserAccount(request.getEmail(), request.getPassword());

        Role defaultRole = roleRepository.findById(2L)
                .orElseThrow(() -> new RuntimeException("Default role USER not found"));

        assignRoleToUser(userAccount, defaultRole);

        saveLoginHistory(userAccount);
    }


    //save user account to db
    private UserAccount createUserAccount(String email, String rawPassword) {
        String encodedPassword = passwordEncoder.encode(rawPassword);
        UserAccount userAccount = UserAccount.builder()
                .email(email)
                .password(encodedPassword)
                .status(UserStatus.ACTIVE)
                .build();
        return userAccountRepository.save(userAccount);
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
        List<UserAccount> users = userAccountRepository.findAll();
        for (UserAccount user : users) {
            if (email.equals(user.getEmail())) {
                return true;
            }
        }
        return false;
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
