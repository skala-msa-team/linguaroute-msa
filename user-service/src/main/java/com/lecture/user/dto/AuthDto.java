package com.lecture.user.dto;

import com.lecture.user.entity.EmailVerification;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class AuthDto {

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmailVerificationRequest {
        @NotBlank(message = "이메일은 필수입니다")
        @Email(message = "올바른 이메일 형식이 아닙니다")
        private String email;

        @NotNull(message = "인증 목적은 필수입니다")
        private EmailVerification.Purpose purpose;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmailVerificationConfirmRequest {
        @NotBlank(message = "이메일은 필수입니다")
        @Email(message = "올바른 이메일 형식이 아닙니다")
        private String email;

        @NotBlank(message = "인증 코드는 필수입니다")
        private String verificationCode;
    }

    @Getter
    @AllArgsConstructor
    public static class AcceptedResponse {
        private boolean accepted;
    }

    @Getter
    @AllArgsConstructor
    public static class EmailVerificationConfirmResponse {
        private String emailVerificationToken;
    }
}
