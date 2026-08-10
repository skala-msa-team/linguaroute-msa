package com.lecture.user.service;

import com.lecture.user.entity.EmailVerification;
import com.lecture.user.error.ApiException;
import com.lecture.user.error.ErrorCode;
import com.lecture.user.repository.EmailVerificationRepository;
import com.lecture.user.security.TokenHash;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationRepository emailVerificationRepository;
    private final Clock clock;

    @Transactional
    public void consumeSignupToken(String email, String rawToken) {
        EmailVerification verification = emailVerificationRepository
                .findByTokenHash(TokenHash.sha256(rawToken))
                .orElseThrow(() -> new ApiException(ErrorCode.INVALID_EMAIL_VERIFICATION));

        LocalDateTime now = LocalDateTime.now(clock);
        if (!verification.canUseForSignup(email, now)) {
            throw new ApiException(ErrorCode.INVALID_EMAIL_VERIFICATION);
        }
        verification.markUsed(now);
    }
}
