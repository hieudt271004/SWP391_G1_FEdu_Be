package com.fedu.fedu.controller.admin;

import com.fedu.fedu.dto.req.UserCreateRequest;
import com.fedu.fedu.dto.req.UserSetStatusRequest;
import com.fedu.fedu.dto.req.UserUpdateRequest;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.service.UserAccountService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Slf4j
@Validated
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Tag(name = "User Management")
public class UserManagementController {

    private final UserAccountService userAccountService;

    @Operation(summary = "Get all users", description = "Return a list of all users")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @GetMapping("/users")
    public ResponseData<java.util.List<com.fedu.fedu.dto.res.UserResponse>> getAllUsers() {
        return new ResponseData<>(HttpStatus.OK.value(), "Success", userAccountService.getAllUsers());
    }

    @Operation(summary = "Get user by ID", description = "Return a specific user by ID")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @GetMapping("/users/{userId}")
    public ResponseData<com.fedu.fedu.dto.res.UserResponse> getUserById(@PathVariable long userId) {
        return new ResponseData<>(HttpStatus.OK.value(), "Success", userAccountService.getProfile(userId));
    }

    @Operation(method = "POST", summary = "Get user from user service and save new user to db ", description = "Get new user")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping(value = "/add")
    public ResponseData<Void> addUser(@RequestBody UserCreateRequest userCreateDTO) {
        userAccountService.createUser(userCreateDTO);
        return new ResponseData<>(HttpStatus.CREATED.value(), "User added successfully");
    }

    @Operation(summary = "Delete user permanently", description = "Handle deletion of user")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @DeleteMapping("/delete")
    public ResponseData<Void> deleteUser(@RequestBody String username) {
        userAccountService.deleteByEmail(username);
        return new ResponseData<>(HttpStatus.OK.value(), "User deleted successfully");
    }

    @Operation(summary = "Change status of user", description = "Send a request to change status of user")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PatchMapping("/status")
    public ResponseData<Void> updateStatus(@RequestBody UserSetStatusRequest userStatusSetDTO) {
        userAccountService.changeUserStatus(userStatusSetDTO.getUserName(), userStatusSetDTO.getStatus());
        return new ResponseData<>(HttpStatus.OK.value(), "update user status success");
    }

    @Operation(summary = "Update user details and role", description = "Allow Admin to update user details and role")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PutMapping("/users/{userId}")
    public ResponseData<Void> updateUser(@PathVariable long userId, @Valid @RequestBody UserUpdateRequest request) {
        userAccountService.updateUser(userId, request);
        return new ResponseData<>(HttpStatus.OK.value(), "User updated successfully");
    }
}
