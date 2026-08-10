package com.lecture.payment.controller;

import com.lecture.payment.dto.PaymentDto;
import com.lecture.payment.security.PaymentRequestContext;
import com.lecture.payment.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final PaymentRequestContext paymentRequestContext;

    @PostMapping
    public ResponseEntity<PaymentDto.ApiResponse<PaymentDto.SubscriptionResponse>> createSubscription(
            @RequestHeader(value = "X-Company-Id", required = false) String companyIdHeader,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody PaymentDto.CreateSubscriptionRequest request) {
        Long companyId = paymentRequestContext.companyId(companyIdHeader);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(PaymentDto.ApiResponse.success(
                        subscriptionService.createSubscription(companyId, idempotencyKey, request)
                ));
    }

    @GetMapping("/me")
    public ResponseEntity<PaymentDto.ApiResponse<PaymentDto.SubscriptionResponse>> getMySubscription(
            @RequestHeader(value = "X-Company-Id", required = false) String companyIdHeader) {
        Long companyId = paymentRequestContext.companyId(companyIdHeader);
        return ResponseEntity.ok(PaymentDto.ApiResponse.success(subscriptionService.getMySubscription(companyId)));
    }

    @PostMapping("/me/cancel")
    public ResponseEntity<PaymentDto.ApiResponse<PaymentDto.SubscriptionResponse>> cancelSubscription(
            @RequestHeader(value = "X-Company-Id", required = false) String companyIdHeader,
            @RequestBody(required = false) PaymentDto.CancelSubscriptionRequest request) {
        Long companyId = paymentRequestContext.companyId(companyIdHeader);
        PaymentDto.CancelSubscriptionRequest cancelRequest =
                request == null ? new PaymentDto.CancelSubscriptionRequest(null) : request;
        return ResponseEntity.ok(PaymentDto.ApiResponse.success(
                subscriptionService.cancelSubscription(companyId, cancelRequest)
        ));
    }
}
