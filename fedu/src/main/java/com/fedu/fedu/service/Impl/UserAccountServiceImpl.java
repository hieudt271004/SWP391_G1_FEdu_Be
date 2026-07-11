package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.UserCreateRequest;
import com.fedu.fedu.dto.req.RegisterRequest;
import com.fedu.fedu.dto.req.SignInRequest;
import com.fedu.fedu.dto.req.UserProfileRequest;
import com.fedu.fedu.dto.req.UserUpdateRequest;
import com.fedu.fedu.dto.res.UserResponse;
import com.fedu.fedu.entity.Role;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.entity.UserRole;
import org.springframework.transaction.annotation.Transactional;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.RoleRepository;
import com.fedu.fedu.repository.UserAccountRepository;
import com.fedu.fedu.repository.UserRoleRepository;
import com.fedu.fedu.service.UserAccountService;
import com.fedu.fedu.utils.enums.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
@Service
public class UserAccountServiceImpl implements UserAccountService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;

    @Override
    public UserAccount getByEmail(String email) {
        return userAccountRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Not found email: " + email));
    }

    @Override
    public void changeUserStatus(String username, UserStatus status) {
        UserAccount userAccount = userAccountRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        userAccount.setStatus(status);
        userAccountRepository.save(userAccount);
    }

    @Override
    public void deleteByEmail(String email) {
        UserAccount userAccount = userAccountRepository.findByEmail(email)
               .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        userAccountRepository.delete(userAccount);
    }

    @Override
    @Transactional
    public void createUser(UserCreateRequest userCreateDTO) {
        if (userAccountRepository.existsByEmail(userCreateDTO.getEmail())) {
            throw new InvalidDataException("Email already exists");
        }
        if (userCreateDTO.getPhone() != null && !userCreateDTO.getPhone().trim().isEmpty() && !"—".equals(userCreateDTO.getPhone().trim())) {
            if (userAccountRepository.existsByPhone(userCreateDTO.getPhone().trim())) {
                throw new InvalidDataException("Số điện thoại đã tồn tại trong hệ thống");
            }
        }
        UserAccount userAccount = createUserAccount(userCreateDTO);
        userAccountRepository.save(userAccount);
        assignUserRole(userAccount, userCreateDTO.getUserRole());
    }

    private UserAccount createUserAccount(UserCreateRequest userCreateDTO) {
        String email = userCreateDTO.getEmail();
        String username = email != null && email.contains("@") ? email.split("@")[0] : "user";
        
        String firstName = (userCreateDTO.getFirstName() != null && !userCreateDTO.getFirstName().trim().isEmpty()) 
                ? userCreateDTO.getFirstName() : username;
        String lastName = (userCreateDTO.getLastName() != null && !userCreateDTO.getLastName().trim().isEmpty()) 
                ? userCreateDTO.getLastName() : "Created";
        
        return UserAccount.builder()
                .email(userCreateDTO.getEmail())
                .password(passwordEncoder.encode(userCreateDTO.getPassword()))
                .status(userCreateDTO.getStatus() != null ? userCreateDTO.getStatus() : UserStatus.ACTIVE)
                .firstName(firstName)
                .lastName(lastName)
                .phone(userCreateDTO.getPhone())
                .avatarUrl(userCreateDTO.getAvatarUrl())
                .isDeleted(false)
                .build();
    }

    @Override
    @Transactional
    public UserAccount createStudentAccount(String email, String firstName, String lastName,
                                            com.fedu.fedu.utils.enums.Gender gender,
                                            java.time.LocalDate dob, String phone, String rawPassword) {
        if (phone != null && !phone.trim().isEmpty() && !"—".equals(phone.trim())) {
            if (userAccountRepository.existsByPhone(phone.trim())) {
                throw new InvalidDataException("Số điện thoại đã tồn tại trong hệ thống");
            }
        }
        UserAccount account = UserAccount.builder()
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .firstName(firstName)
                .lastName(lastName)
                .gender(gender)
                .bod(dob)
                .phone(phone)
                .status(UserStatus.ACTIVE)
                .isDeleted(false)
                .build();
        userAccountRepository.save(account);
        assignUserRole(account, com.fedu.fedu.utils.enums.UserRole.STUDENT);
        return account;
    }

    private void assignUserRole(UserAccount userAccount, com.fedu.fedu.utils.enums.UserRole userRole) {
        
        com.fedu.fedu.utils.enums.UserRole targetRole =
                (userRole != null) ? userRole : com.fedu.fedu.utils.enums.UserRole.USER;

        Role role = roleRepository.findByRoleName(targetRole)
                .orElseThrow(() -> new IllegalStateException("Role not found: " + targetRole));

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
    @Transactional
    public void save(RegisterRequest request) {
        
        if (userAccountRepository.existsByEmail(request.getEmail())) {
            throw new InvalidDataException("Email already exists");
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

        Role defaultRole = roleRepository.findByRoleName(com.fedu.fedu.utils.enums.UserRole.STUDENT)
                .orElseThrow(() -> new IllegalStateException("Default role STUDENT not found"));

        assignRoleToUser(userAccount, defaultRole);
    }

    private void assignRoleToUser(UserAccount userAccount, Role role) {
        UserRole userRole = UserRole.builder()
                .role(role)
                .userAccount(userAccount)
                .build();
        userRoleRepository.save(userRole);
        userAccount.setUserRoles(Collections.singletonList(userRole));
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
        return userAccountRepository.findAllRoleByUserId(userId)
                .stream()
                .map(Enum::name)
                .toList();
    }
    
    @Override
    public UserAccount getById(long userId) {
        return userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }
    
    @Override
    public UserResponse updateProfile(long userId, UserProfileRequest request) {
        log.info("---------- updateProfile for userId: {} ----------", userId);
        
        UserAccount userAccount = getById(userId);
        
        String phone = request.getPhone();
        if (phone != null && !phone.trim().isEmpty() && !"—".equals(phone.trim())) {
            if (userAccountRepository.existsByPhoneAndUserIdNot(phone.trim(), userId)) {
                throw new InvalidDataException("Số điện thoại đã tồn tại trong hệ thống");
            }
        }
        
        
        userAccount.setFirstName(request.getFirstName());
        userAccount.setLastName(request.getLastName());
        userAccount.setPhone(request.getPhone());
        userAccount.setGender(request.getGender());
        userAccount.setBod(request.getBod());
        
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            userAccount.setAvatarUrl(request.getAvatarUrl());
        }
        
        userAccountRepository.save(userAccount);
        
        return convertToUserResponse(userAccount);
    }
    
    @Override
    public List<UserResponse> getAllUsers() {
        return userAccountRepository.findAllWithRoles().stream()
                .map(this::convertToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    public UserResponse getProfile(long userId) {
        log.info("---------- getProfile for userId: {} ----------", userId);
        UserAccount userAccount = getById(userId);
        return convertToUserResponse(userAccount);
    }
    
    private UserResponse convertToUserResponse(UserAccount userAccount) {
        List<String> roles = userAccount.getUserRoles().stream()
                .map(ur -> ur.getRole().getRoleName().name())
                .collect(Collectors.toList());
        
        return UserResponse.builder()
                .userId(userAccount.getUserId())
                .email(userAccount.getEmail())
                .firstName(userAccount.getFirstName())
                .lastName(userAccount.getLastName())
                .phone(userAccount.getPhone())
                .gender(userAccount.getGender())
                .bod(userAccount.getBod())
                .avatarUrl(userAccount.getAvatarUrl())
                .status(userAccount.getStatus())
                .roles(roles)
                .createdAt(userAccount.getCreatedAt())
                .updatedAt(userAccount.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public void updateUser(long userId, UserUpdateRequest request) {
        log.info("---------- updateUser for userId: {} ----------", userId);
        
        UserAccount userAccount = getById(userId);
        
        String phone = request.getPhone();
        if (phone != null && !phone.trim().isEmpty() && !"—".equals(phone.trim())) {
            if (userAccountRepository.existsByPhoneAndUserIdNot(phone.trim(), userId)) {
                throw new InvalidDataException("Số điện thoại đã tồn tại trong hệ thống");
            }
        }
        
        
        userAccount.setFirstName(request.getFirstName());
        userAccount.setLastName(request.getLastName());
        userAccount.setPhone(request.getPhone());
        userAccount.setGender(request.getGender());
        userAccount.setBod(request.getBod());
        
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            userAccount.setAvatarUrl(request.getAvatarUrl());
        }
        
        
        if (request.getStatus() != null) {
            userAccount.setStatus(request.getStatus());
        }

        if (request.getUserRole() != null) {
            Role role = roleRepository.findByRoleName(request.getUserRole())
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.getUserRole()));
            List<UserRole> roles = userAccount.getUserRoles();
            if (roles == null) {
                roles = new java.util.ArrayList<>();
                userAccount.setUserRoles(roles);
            }
            if (roles.isEmpty()) {
                roles.add(UserRole.builder()
                        .role(role)
                        .userAccount(userAccount)
                        .build());
            } else {
                roles.get(0).setRole(role);
                while (roles.size() > 1) {
                    roles.remove(roles.size() - 1);
                }
            }
        }

        userAccountRepository.save(userAccount);
     }

    @Override
    @Transactional
    public void resetAllPasswordsTo123456() {
        log.info("---------- resetAllPasswordsTo123456 ----------");
        String encodedPassword = passwordEncoder.encode("123456");
        List<UserAccount> users = userAccountRepository.findAll();
        for (UserAccount user : users) {
            user.setPassword(encodedPassword);
        }
        userAccountRepository.saveAll(users);
        log.info("Reset {} user passwords to 123456 successfully", users.size());
    }

    @Override
    @Transactional
    public void createDefaultAdmin() {
        log.info("---------- createDefaultAdmin ----------");
        String adminEmail = "admin@gmail.com";
        
        UserAccount userAccount = userAccountRepository.findByEmail(adminEmail).orElse(null);
        if (userAccount == null) {
            userAccount = UserAccount.builder()
                    .email(adminEmail)
                    .password(passwordEncoder.encode("123456"))
                    .status(UserStatus.ACTIVE)
                    .firstName("System")
                    .lastName("Admin")
                    .isDeleted(false)
                    .build();
            userAccountRepository.save(userAccount);
        } else {
            userAccount.setPassword(passwordEncoder.encode("123456"));
            userAccount.setStatus(UserStatus.ACTIVE);
            userAccountRepository.save(userAccount);
        }

        Role adminRole = roleRepository.findByRoleName(com.fedu.fedu.utils.enums.UserRole.ADMIN)
                .orElseThrow(() -> new IllegalStateException("Role ADMIN not found"));

        boolean hasAdminRole = false;
        if (userAccount.getUserRoles() != null) {
            hasAdminRole = userAccount.getUserRoles().stream()
                    .anyMatch(ur -> ur.getRole().getRoleName() == com.fedu.fedu.utils.enums.UserRole.ADMIN);
        }

        if (!hasAdminRole) {
            if (userAccount.getUserRoles() != null) {
                userRoleRepository.deleteAll(userAccount.getUserRoles());
            }
            UserRole userRole = UserRole.builder()
                    .role(adminRole)
                    .userAccount(userAccount)
                    .build();
            userRoleRepository.save(userRole);
            userAccount.setUserRoles(Collections.singletonList(userRole));
        }
        log.info("Admin user created/updated successfully with email admin@gmail.com and role ADMIN");
    }
}