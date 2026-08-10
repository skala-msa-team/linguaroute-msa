# LinguaRoute API 명세서

## 1. 문서 정보

| 항목 | 내용 |
| --- | --- |
| 대상 서비스 | AI 기반 기업 외국어교육 구독 플랫폼 |
| API 진입점 | API Gateway |
| 기본 경로 | `/api` |
| 데이터 형식 | `application/json` |
| 인증 방식 | `Authorization: Bearer {accessToken}` |
| 날짜 형식 | ISO 8601, 예: `2026-08-10T10:30:00+09:00` |
| 문서 상태 | MVP 설계 초안 |

이 문서의 URL은 기능 설계를 위한 초안입니다. 구현 후에는 Swagger UI에서 실제 Method, URL, Request 및 Response를 호출하여 최종 명세와 일치시켜야 합니다.

---

## 2. 공통 규칙

### 2.1 권한

| 권한 | 설명 |
| --- | --- |
| `PLATFORM_ADMIN` | 전체 기업·사용자·강의·결제·수강 상태 관리 |
| `COMPANY_ADMIN` | 자신의 기업, 직원, 좌석, 구독 및 결제 관리 |
| `EMPLOYEE` | 강의 조회·수강신청·학습·AI 추천 사용 |

### 2.2 공통 성공 응답

```json
{
  "data": {},
  "timestamp": "2026-08-10T10:30:00+09:00"
}
```

### 2.3 공통 오류 응답

```json
{
  "code": "INVITATION_EXPIRED",
  "message": "만료된 초대코드입니다.",
  "timestamp": "2026-08-10T10:30:00+09:00"
}
```

### 2.4 공통 상태 코드

| 상태 코드 | 사용 상황 |
| --- | --- |
| `200 OK` | 조회·수정·취소 성공 |
| `201 Created` | 회원·초대코드·강의·수강신청·결제 생성 성공 |
| `204 No Content` | 응답 본문이 필요 없는 삭제·폐기 성공 |
| `400 Bad Request` | 형식 오류 또는 필수값 누락 |
| `401 Unauthorized` | 로그인 또는 토큰 필요 |
| `403 Forbidden` | 역할 또는 기업 소속 권한 부족 |
| `404 Not Found` | 대상 자원 없음 |
| `409 Conflict` | 중복 가입·중복 신청·중복 결제·좌석 초과 |
| `422 Unprocessable Entity` | 상태상 처리할 수 없는 요청 |
| `503 Service Unavailable` | 외부 AI 또는 결제 시스템 장애 |

---

## 3. 인증 API

| ID | Method | URL | 권한 | 기능 | MVP |
| --- | --- | --- | --- | --- | --- |
| AUTH-01 | `POST` | `/api/auth/login` | 공개 | 로그인 | 필수 |
| AUTH-02 | `POST` | `/api/auth/logout` | 로그인 | 로그아웃 | 필수 |
| AUTH-03 | `POST` | `/api/auth/password-reset/requests` | 공개 | 비밀번호 재설정 요청 | 필수 |
| AUTH-04 | `POST` | `/api/auth/password-reset/confirm` | 공개 | 재설정 토큰으로 비밀번호 변경 | 필수 |

### AUTH-01 로그인

요청:

```json
{
  "email": "admin@company.com",
  "password": "Password123!"
}
```

응답 `200 OK`:

```json
{
  "data": {
    "accessToken": "access-token",
    "refreshToken": "refresh-token",
    "expiresIn": 3600,
    "role": "COMPANY_ADMIN"
  },
  "timestamp": "2026-08-10T10:30:00+09:00"
}
```

비밀번호 재설정 토큰을 어떤 채널로 전달할지는 별도로 확정해야 합니다. 이메일 인증을 보류하는 경우에도 재설정 링크 전송을 위한 이메일 소유 확인 정책이 필요합니다.

---

## 4. 기업·사용자 API

| ID | Method | URL | 권한 | 기능 | MVP |
| --- | --- | --- | --- | --- | --- |
| COMPANY-01 | `POST` | `/api/companies` | 공개 | 기업 대표계정 회원가입 | 필수 |
| COMPANY-02 | `GET` | `/api/companies/me` | 기업 관리자 | 기업 정보 조회 | 필수 |
| COMPANY-03 | `PATCH` | `/api/companies/me` | 기업 관리자 | 기업 정보 수정 | 필수 |
| USER-01 | `GET` | `/api/users/me` | 로그인 | 내 정보 조회 | 필수 |
| USER-02 | `PATCH` | `/api/users/me` | 로그인 | 내 정보 수정 | 필수 |
| USER-03 | `PUT` | `/api/users/me/password` | 로그인 | 비밀번호 변경 | 필수 |
| USER-04 | `DELETE` | `/api/users/me` | 로그인 | 회원 탈퇴 | 선택 |

### COMPANY-01 기업 대표계정 회원가입

요청:

```json
{
  "company": {
    "name": "스칼라테크",
    "businessNumber": "123-45-67890"
  },
  "admin": {
    "email": "admin@company.com",
    "password": "Password123!",
    "name": "김관리"
  },
  "agreementIds": [1, 2]
}
```

응답 `201 Created`:

```json
{
  "data": {
    "companyId": 10,
    "userId": 101,
    "role": "COMPANY_ADMIN",
    "status": "ACTIVE"
  },
  "timestamp": "2026-08-10T10:30:00+09:00"
}
```

---

## 5. 직원 초대·좌석 API

| ID | Method | URL | 권한 | 기능 | MVP |
| --- | --- | --- | --- | --- | --- |
| INVITE-01 | `POST` | `/api/companies/me/invitations` | 기업 관리자 | 일회용 초대코드 생성 | 필수 |
| INVITE-02 | `GET` | `/api/companies/me/invitations` | 기업 관리자 | 초대코드 목록·상태 조회 | 필수 |
| INVITE-03 | `DELETE` | `/api/companies/me/invitations/{invitationId}` | 기업 관리자 | 초대코드 폐기 | 필수 |
| INVITE-04 | `POST` | `/api/companies/me/invitations/{invitationId}/reissue` | 기업 관리자 | 초대코드 재발급 | 필수 |
| EMPLOYEE-01 | `POST` | `/api/employees/signup` | 공개 | 초대코드 기반 직원 가입 | 필수 |
| EMPLOYEE-02 | `GET` | `/api/companies/me/employees` | 기업 관리자 | 소속 직원 목록 조회 | 필수 |
| EMPLOYEE-03 | `PATCH` | `/api/companies/me/employees/{userId}/status` | 기업 관리자 | 직원 비활성화·소속 해제 | 필수 |
| SEAT-01 | `GET` | `/api/companies/me/seats` | 기업 관리자 | 구매·사용·잔여 좌석 조회 | 필수 |

### INVITE-01 초대코드 생성

요청:

```json
{
  "expiresInDays": 7
}
```

응답 `201 Created`:

```json
{
  "data": {
    "invitationId": 501,
    "code": "A7K9-P2QM",
    "status": "UNUSED",
    "expiresAt": "2026-08-17T23:59:59+09:00"
  },
  "timestamp": "2026-08-10T10:30:00+09:00"
}
```

### EMPLOYEE-01 직원 가입

요청:

```json
{
  "invitationCode": "A7K9-P2QM",
  "email": "employee@company.com",
  "password": "Password123!",
  "name": "이직원"
}
```

서버 처리 순서:

```text
초대코드 존재·만료·사용 여부 검사
→ 기업 구독 ACTIVE 검사
→ 잔여 좌석 검사
→ 직원 계정 생성
→ 좌석 배정
→ 초대코드 USED 처리
```

오류 코드:

| HTTP | 오류 코드 | 조건 |
| --- | --- | --- |
| `409` | `INVITATION_ALREADY_USED` | 이미 사용한 코드 |
| `409` | `SEAT_LIMIT_EXCEEDED` | 잔여 좌석 없음 |
| `422` | `INVITATION_EXPIRED` | 코드 만료 |
| `422` | `SUBSCRIPTION_INACTIVE` | 구독 비활성 |

### SEAT-01 좌석 조회 응답

```json
{
  "data": {
    "purchased": 50,
    "used": 42,
    "remaining": 8
  },
  "timestamp": "2026-08-10T10:30:00+09:00"
}
```

---

## 6. 강의·차시 API

| ID | Method | URL | 권한 | 기능 | MVP |
| --- | --- | --- | --- | --- | --- |
| COURSE-01 | `GET` | `/api/courses` | 직원 | 목록·검색·필터 | 필수 |
| COURSE-02 | `GET` | `/api/courses/{courseId}` | 직원 | 강의 상세 조회 | 필수 |
| COURSE-03 | `GET` | `/api/courses/{courseId}/lessons` | 직원 | 강의 차시 목록 조회 | 필수 |
| ADMIN-COURSE-01 | `POST` | `/api/admin/courses` | 플랫폼 관리자 | 강의 등록 | 필수 |
| ADMIN-COURSE-02 | `PATCH` | `/api/admin/courses/{courseId}` | 플랫폼 관리자 | 강의 수정 | 필수 |
| ADMIN-COURSE-03 | `PATCH` | `/api/admin/courses/{courseId}/status` | 플랫폼 관리자 | 강의 활성·비활성 | 필수 |
| ADMIN-LESSON-01 | `POST` | `/api/admin/courses/{courseId}/lessons` | 플랫폼 관리자 | 강의 차시 등록 | 필수 |

### COURSE-01 목록·검색·필터

요청 예시:

```http
GET /api/courses?keyword=미팅&language=ENGLISH&situation=CUSTOMER_MEETING&level=INTERMEDIATE&page=0&size=20
```

응답 `200 OK`:

```json
{
  "data": {
    "content": [
      {
        "courseId": 12,
        "title": "해외 고객 미팅 영어",
        "language": "ENGLISH",
        "situation": "CUSTOMER_MEETING",
        "level": "INTERMEDIATE",
        "status": "ACTIVE"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1
  },
  "timestamp": "2026-08-10T10:30:00+09:00"
}
```

### ADMIN-COURSE-01 강의 등록

```json
{
  "title": "해외 고객 미팅 영어",
  "description": "고객 미팅에서 사용하는 비즈니스 영어 과정",
  "language": "ENGLISH",
  "situation": "CUSTOMER_MEETING",
  "level": "INTERMEDIATE"
}
```

---

## 7. 수강·학습 API

| ID | Method | URL | 권한 | 기능 | MVP |
| --- | --- | --- | --- | --- | --- |
| ENROLL-01 | `POST` | `/api/enrollments` | 직원 | 개별 강의 수강신청 | 필수 |
| ENROLL-02 | `GET` | `/api/enrollments/me` | 직원 | 신청한 강의 목록 조회 | 필수 |
| ENROLL-03 | `GET` | `/api/enrollments/{enrollmentId}` | 직원 | 수강 상태·진도율 조회 | 필수 |
| LEARNING-01 | `POST` | `/api/enrollments/{enrollmentId}/lessons/{lessonId}/start` | 직원 | 차시 학습 시작 | 필수 |
| LEARNING-02 | `POST` | `/api/enrollments/{enrollmentId}/lessons/{lessonId}/complete` | 직원 | 차시 완료 | 필수 |
| COMPANY-ENROLL-01 | `GET` | `/api/companies/me/enrollments` | 기업 관리자 | 직원별 수강 상태 조회 | 필수 |
| COMPANY-ENROLL-02 | `GET` | `/api/companies/me/enrollments/progress` | 기업 관리자 | 직원별 진도율 조회 | 선택 |

### ENROLL-01 수강신청

요청:

```json
{
  "courseId": 12
}
```

처리 조건:

```text
로그인 사용자가 EMPLOYEE인가?
→ 기업 구독이 ACTIVE인가?
→ 강의가 ACTIVE인가?
→ 같은 강의를 이미 신청하지 않았는가?
→ 수강신청 생성
```

응답 `201 Created`:

```json
{
  "data": {
    "enrollmentId": 9001,
    "courseId": 12,
    "status": "ENROLLED",
    "progressRate": 0
  },
  "timestamp": "2026-08-10T10:30:00+09:00"
}
```

중복 신청은 `409 DUPLICATE_ENROLLMENT`를 반환합니다.

### LEARNING-02 차시 완료 응답

```json
{
  "data": {
    "enrollmentId": 9001,
    "lessonId": 103,
    "lessonStatus": "COMPLETED",
    "progressRate": 60,
    "enrollmentStatus": "LEARNING",
    "completedAt": "2026-08-10T14:00:00+09:00"
  },
  "timestamp": "2026-08-10T14:00:00+09:00"
}
```

진도율은 클라이언트가 보내지 않고 서버가 `완료 차시 수 / 전체 필수 차시 수 × 100`으로 계산합니다.

---

## 8. 요금제·구독·결제 API

| ID | Method | URL | 권한 | 기능 | MVP |
| --- | --- | --- | --- | --- | --- |
| PLAN-01 | `GET` | `/api/plans` | 기업 관리자 | 월간·연간 요금제 조회 | 필수 |
| SUB-01 | `POST` | `/api/subscriptions` | 기업 관리자 | 구독권 결제 | 필수 |
| SUB-02 | `GET` | `/api/subscriptions/me` | 기업 관리자 | 구독 상태·만료일·갱신일 조회 | 필수 |
| SUB-03 | `POST` | `/api/subscriptions/me/cancel` | 기업 관리자 | 구독 해지 | 필수 |
| PAY-01 | `GET` | `/api/payments` | 기업 관리자 | 결제 내역 조회 | 필수 |
| REFUND-01 | `POST` | `/api/payments/{paymentId}/refund-requests` | 기업 관리자 | 환불 요청 | 선택 |

### PLAN-01 요금제 조회 응답

```json
{
  "data": [
    {
      "planPriceId": 1,
      "planName": "BUSINESS_50",
      "billingCycle": "MONTHLY",
      "seatLimit": 50,
      "price": 299000,
      "currency": "KRW"
    },
    {
      "planPriceId": 2,
      "planName": "BUSINESS_50",
      "billingCycle": "YEARLY",
      "seatLimit": 50,
      "price": 2990000,
      "currency": "KRW"
    }
  ],
  "timestamp": "2026-08-10T10:30:00+09:00"
}
```

### SUB-01 구독 결제

헤더:

```http
Idempotency-Key: 1e7f52d5-c0d5-4a86-aefe-3334f664ee65
```

요청:

```json
{
  "planPriceId": 1,
  "paymentMethodToken": "payment-method-token"
}
```

성공 응답 `201 Created`:

```json
{
  "data": {
    "subscriptionId": 7001,
    "paymentId": 8001,
    "status": "ACTIVE",
    "currentPeriodStart": "2026-08-10T10:30:00+09:00",
    "currentPeriodEnd": "2026-09-10T10:30:00+09:00",
    "nextBillingAt": "2026-09-10T10:30:00+09:00"
  },
  "timestamp": "2026-08-10T10:30:00+09:00"
}
```

동일한 멱등성 키로 다시 요청하면 새 결제를 생성하지 않고 기존 결과를 반환합니다.

### SUB-03 구독 해지

```json
{
  "reason": "교육 인원 감소"
}
```

해지는 즉시 이용 권한을 제거하지 않고 현재 이용 기간 종료 후 `EXPIRED`가 되도록 설계합니다.

---

## 9. AI 강의 추천 API

| ID | Method | URL | 권한 | 기능 | MVP |
| --- | --- | --- | --- | --- | --- |
| AI-01 | `POST` | `/api/courses/recommendations` | 직원 | AI 강의 추천 | 필수 |
| AI-02 | `POST` | `/api/courses/recommendations/{recommendationId}/reject` | 직원 | 추천 거부 | 선택 |

### AI-01 추천 요청

```json
{
  "language": "ENGLISH",
  "level": "INTERMEDIATE",
  "job": "GLOBAL_SALES",
  "situation": "CUSTOMER_MEETING",
  "goal": "제품을 자연스럽게 설명하고 싶음"
}
```

성공 응답 `200 OK`:

```json
{
  "data": {
    "recommendationId": 3001,
    "source": "AI",
    "courses": [
      {
        "courseId": 12,
        "title": "해외 고객 미팅 영어",
        "language": "ENGLISH",
        "level": "INTERMEDIATE",
        "reason": "해외영업 직무와 고객 미팅 목표에 적합합니다."
      }
    ]
  },
  "timestamp": "2026-08-10T10:30:00+09:00"
}
```

AI 장애 시 대체 응답:

```json
{
  "data": {
    "recommendationId": 3002,
    "source": "RULE_BASED_FALLBACK",
    "courses": [
      {
        "courseId": 12,
        "title": "해외 고객 미팅 영어",
        "reason": "선택한 언어, 수준과 상황이 일치하는 강의입니다."
      }
    ]
  },
  "timestamp": "2026-08-10T10:30:00+09:00"
}
```

AI가 반환한 강의 ID는 응답 전에 실제 `ACTIVE` 강의 및 선택 언어와 다시 대조합니다.

---

## 10. 약관 API

| ID | Method | URL | 권한 | 기능 | MVP |
| --- | --- | --- | --- | --- | --- |
| TERM-01 | `GET` | `/api/terms/active` | 공개 | 현재 필수·선택 약관 조회 | 필수 |
| TERM-02 | `POST` | `/api/users/me/agreements` | 로그인 | 약관 동의 저장 | 필수 |

---

## 11. 플랫폼 운영 API

| ID | Method | URL | 권한 | 기능 | MVP |
| --- | --- | --- | --- | --- | --- |
| OPS-01 | `GET` | `/api/admin/users` | 플랫폼 관리자 | 사용자 상태 조회 | 필수 |
| OPS-02 | `GET` | `/api/admin/companies` | 플랫폼 관리자 | 기업 상태 조회 | 필수 |
| OPS-03 | `GET` | `/api/admin/payments` | 플랫폼 관리자 | 결제 상태 조회 | 필수 |
| OPS-04 | `GET` | `/api/admin/enrollments` | 플랫폼 관리자 | 수강 상태 조회 | 필수 |
| OPS-05 | `GET` | `/api/admin/audit-logs` | 플랫폼 관리자 | 주요 감사 로그 조회 | 필수 |

운영 화면이 데이터를 한 번에 조회하더라도 각 데이터의 소유 서비스는 유지합니다. 별도 운영 DB를 추가하지 않고 API Gateway 또는 프론트엔드가 각 서비스의 관리자 조회 API를 조합합니다.

---

## 12. 주요 오류 코드

| 오류 코드 | HTTP | 설명 |
| --- | --- | --- |
| `INVALID_CREDENTIALS` | `401` | 이메일 또는 비밀번호 불일치 |
| `COMPANY_NOT_FOUND` | `404` | 기업 없음 |
| `INVITATION_NOT_FOUND` | `404` | 초대코드 없음 |
| `INVITATION_ALREADY_USED` | `409` | 사용된 초대코드 |
| `INVITATION_EXPIRED` | `422` | 만료된 초대코드 |
| `SEAT_LIMIT_EXCEEDED` | `409` | 좌석 한도 초과 |
| `SUBSCRIPTION_INACTIVE` | `422` | 활성 구독 없음 |
| `DUPLICATE_PAYMENT` | `409` | 중복 결제 요청 |
| `PAYMENT_FAILED` | `422` | 결제 실패 |
| `COURSE_NOT_FOUND` | `404` | 강의 없음 |
| `COURSE_INACTIVE` | `422` | 비활성 강의 |
| `DUPLICATE_ENROLLMENT` | `409` | 중복 수강신청 |
| `ENROLLMENT_NOT_FOUND` | `404` | 수강신청 없음 |
| `AI_RECOMMENDATION_FAILED` | `503` | AI와 대체 추천 모두 실패 |

---

## 13. Swagger 검증 체크리스트

| 확인 항목 | 완료 기준 |
| --- | --- |
| API Gateway 경로 | 모든 프론트 요청이 Gateway 주소를 사용함 |
| 인증 | 로그인 토큰으로 보호 API 호출 성공 |
| 요청 형식 | Swagger Request Body와 본 문서가 일치함 |
| 응답 형식 | Swagger Response와 본 문서가 일치함 |
| 상태 코드 | 정상·예외 상태 코드가 실제 응답과 일치함 |
| 권한 | 기업 관리자·직원·플랫폼 관리자 권한이 분리됨 |
| 결제 이벤트 | 결제 전후 구독 권한 상태 변화 확인 |
| AI 추천 | 실제 활성 강의 ID만 반환되는지 확인 |
