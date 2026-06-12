package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.UserCreateRequest;
import com.fedu.fedu.dto.req.RegisterRequest;
import com.fedu.fedu.dto.req.SignInRequest;
import com.fedu.fedu.dto.req.UserProfileRequest;
import com.fedu.fedu.dto.req.UserUpdateRequest;
import com.fedu.fedu.dto.res.UserResponse;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.utils.enums.UserStatus;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.List;

public interface UserAccountService {

    UserDetailsService userDetailService();

    List<String> getAllRoleByEmail(long userId);

    boolean emailExist(String email);

    UserAccount getByEmail(String email);
    
    UserAccount getById(long userId);

    List<UserResponse> getAllUsers();

    void changeUserStatus(String username, UserStatus status);

    void verifyAccount(String email);

    void save(UserAccount userAccount);

    void save(RegisterRequest request);

    void registerUser(UserAccount userAccount);

    void updateLastLogin(SignInRequest request);

    void createUser(UserCreateRequest userCreateDTO);

    void deleteByEmail(String email);
    
    UserResponse updateProfile(long userId, UserProfileRequest request);
    
    UserResponse getProfile(long userId);

    void updateUser(long userId, UserUpdateRequest request);
}
