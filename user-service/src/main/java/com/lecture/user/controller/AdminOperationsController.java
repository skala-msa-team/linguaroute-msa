package com.lecture.user.controller;

import com.lecture.user.dto.ApiResponse;
import com.lecture.user.dto.CompanyDto;
import com.lecture.user.dto.UserDto;
import com.lecture.user.security.AuthenticatedUser;
import com.lecture.user.service.CompanyService;
import com.lecture.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminOperationsController {
    private final UserService userService;
    private final CompanyService companyService;
    private final AuthenticatedUser authenticatedUser;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDto.UserResponse>>> getUsers(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.getAllForPlatformAdmin(authenticatedUser.userId(jwt))));
    }

    @GetMapping("/companies")
    public ResponseEntity<ApiResponse<List<CompanyDto.AdminResponse>>> getCompanies(@AuthenticationPrincipal Jwt jwt) {
        Long requesterId = authenticatedUser.userId(jwt);
        userService.requirePlatformAdmin(requesterId);
        return ResponseEntity.ok(ApiResponse.success(companyService.getAllForPlatformAdmin(requesterId)));
    }
}
