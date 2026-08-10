package com.lecture.user.controller;

import com.lecture.user.dto.ApiResponse;
import com.lecture.user.dto.CompanyDto;
import com.lecture.user.service.CompanyService;
import com.lecture.user.security.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;
    private final AuthenticatedUser authenticatedUser;

    @PostMapping
    public ResponseEntity<ApiResponse<CompanyDto.RegisterResponse>> register(
            @Valid @RequestBody CompanyDto.RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(companyService.register(request)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CompanyDto.Response>> getMyCompany(
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(ApiResponse.success(
                companyService.getMyCompany(authenticatedUser.userId(jwt))
        ));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<CompanyDto.Response>> updateMyCompany(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CompanyDto.UpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                companyService.updateMyCompany(authenticatedUser.userId(jwt), request)
        ));
    }
}
