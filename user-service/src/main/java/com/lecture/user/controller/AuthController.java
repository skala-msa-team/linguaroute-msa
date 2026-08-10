package com.lecture.user.controller;

import com.lecture.user.dto.ApiResponse;
import com.lecture.user.dto.AuthDto;
import com.lecture.user.service.EmailVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/register")
@RequiredArgsConstructor
public class AuthController {

    private final EmailVerificationService emailVerificationService;

    @PostMapping(params = "action=request-email-verification")
    public ResponseEntity<ApiResponse<AuthDto.AcceptedResponse>> requestEmailVerification(
            @Valid @RequestBody AuthDto.EmailVerificationRequest request
    ) {
        emailVerificationService.requestSignupVerification(request);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success(new AuthDto.AcceptedResponse(true)));
    }

    @PostMapping(params = "action=confirm-email-verification")
    public ResponseEntity<ApiResponse<AuthDto.EmailVerificationConfirmResponse>> confirmEmailVerification(
            @Valid @RequestBody AuthDto.EmailVerificationConfirmRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                emailVerificationService.confirmSignupVerification(request)
        ));
    }
}
