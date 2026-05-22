package com.fedu.fedu.controller;

import com.fedu.fedu.dto.req.UserCreateRequest;
import com.fedu.fedu.dto.req.UserSetStatusRequest;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.ResponseError;
import com.fedu.fedu.service.UserAccountService;
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

    // get user from user service and save new user to db
    @Operation(method = "POST", summary = "Get user from user service and save new user to db ", description = "Get new user")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PostMapping(value = "/add")
    public ResponseData<Void> addUser(@RequestBody UserCreateRequest userCreateDTO) {
        try {
            userAccountService.createUser(userCreateDTO);
            return new ResponseData<>(HttpStatus.CREATED.value(), "User added successfully");
        } catch (Exception e) {
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Unexpected error: " + e.getMessage());
        }

    }

    @Operation(summary = "Delete user permanently", description = "Handle deletion of user")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
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
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PatchMapping("/status")
    public ResponseData<Void> updateStatus(@RequestBody UserSetStatusRequest userStatusSetDTO) {
        try {
            userAccountService.changeUserStatus(userStatusSetDTO.getUserName(), userStatusSetDTO.getStatus());
            return new ResponseData<>(HttpStatus.ACCEPTED.value(), "update user status success");
        } catch (Exception e) {
            log.info("{}", e.getMessage(), e.getCause());
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "update user status failed");
        }
    }
}
