package com.lecture.payment.security;

import com.lecture.payment.exception.PaymentErrorCode;
import com.lecture.payment.exception.PaymentException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class PaymentRequestContext {

    public Long companyId(String companyIdHeader) {
        if (!StringUtils.hasText(companyIdHeader)) {
            throw new PaymentException(PaymentErrorCode.MISSING_COMPANY_CONTEXT);
        }
        try {
            return Long.parseLong(companyIdHeader);
        } catch (NumberFormatException e) {
            throw new PaymentException(PaymentErrorCode.MISSING_COMPANY_CONTEXT);
        }
    }
}
