-- LinguaRoute MVP 초기 DDL
-- 공용 lecture_db 안에서 서비스별 소유 테이블만 실제 FK를 만들고,
-- 다른 서비스의 ID는 논리 참조값으로만 저장한다.

CREATE TABLE IF NOT EXISTS companies (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    name                VARCHAR(100) NOT NULL,
    business_number     VARCHAR(10)  NOT NULL,
    status              VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE | INACTIVE',
    created_at          DATETIME(6)  NOT NULL,
    updated_at          DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_companies_business_number (business_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    company_id          BIGINT,
    email               VARCHAR(255) NOT NULL,
    password            VARCHAR(255) NOT NULL,
    name                VARCHAR(100) NOT NULL,
    role                VARCHAR(20)  NOT NULL COMMENT 'STUDENT | INSTRUCTOR',
    business_role       VARCHAR(30)  NOT NULL COMMENT 'PLATFORM_ADMIN | COMPANY_ADMIN | EMPLOYEE',
    status              VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE | INACTIVE | WITHDRAWN',
    created_at          DATETIME(6),
    updated_at          DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS email_verifications (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    email               VARCHAR(255) NOT NULL,
    purpose             VARCHAR(30)  NOT NULL COMMENT 'SIGNUP',
    code_hash           CHAR(64)     NOT NULL,
    token_hash          CHAR(64),
    expires_at          DATETIME(6)  NOT NULL,
    verified_at         DATETIME(6),
    used_at             DATETIME(6),
    created_at          DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_email_verifications_token_hash (token_hash),
    KEY idx_email_verifications_email_purpose (email, purpose)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS terms (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    type                VARCHAR(50)  NOT NULL,
    version             VARCHAR(30)  NOT NULL,
    content             TEXT         NOT NULL,
    required            BOOLEAN      NOT NULL,
    effective_at        DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_terms_type_version (type, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_agreements (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    user_id             BIGINT      NOT NULL,
    term_id             BIGINT      NOT NULL,
    agreed              BOOLEAN     NOT NULL,
    agreed_at           DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_agreements_user_term (user_id, term_id),
    CONSTRAINT fk_user_agreements_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_agreements_term FOREIGN KEY (term_id) REFERENCES terms(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS company_entitlements (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    company_id          BIGINT      NOT NULL,
    subscription_id     BIGINT      NOT NULL COMMENT 'payment-service subscriptions.id 논리 참조',
    entitlement_status  VARCHAR(20) NOT NULL COMMENT 'ACTIVE | EXPIRED',
    seat_limit          INT         NOT NULL,
    current_period_end  DATETIME(6) NOT NULL,
    auto_renew          BOOLEAN     NOT NULL,
    created_at          DATETIME(6) NOT NULL,
    updated_at          DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_company_entitlements_company (company_id),
    CONSTRAINT fk_company_entitlements_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS processed_events (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    event_id            CHAR(36)    NOT NULL,
    event_type          VARCHAR(50) NOT NULL,
    occurred_at         DATETIME(6),
    processed_at        DATETIME(6) NOT NULL,
    created_at          DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_processed_events_event_id (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO terms (id, type, version, content, required, effective_at)
VALUES
    (1, 'SERVICE_TERMS', '1.0', 'LinguaRoute 서비스 이용약관', TRUE, '2026-08-10 00:00:00'),
    (2, 'PRIVACY_COLLECTION', '1.0', 'LinguaRoute 개인정보 수집 및 이용 동의', TRUE, '2026-08-10 00:00:00')
ON DUPLICATE KEY UPDATE id = id;

CREATE TABLE IF NOT EXISTS courses (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    language            VARCHAR(50)  NOT NULL COMMENT 'ENGLISH | JAPANESE | CHINESE',
    situation           VARCHAR(50)  NOT NULL COMMENT 'CUSTOMER_MEETING | PRESENTATION | EMAIL | BUSINESS_TRIP | DAILY_CONVERSATION',
    level               VARCHAR(50)  NOT NULL COMMENT 'BEGINNER | ELEMENTARY | INTERMEDIATE | ADVANCED',
    status              VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE | INACTIVE',
    created_at          DATETIME(6),
    updated_at          DATETIME(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- [설계 이유 - 추천 데이터 소유권]
-- 초기 구현은 SQLAlchemy가 실행 시 테이블을 자동 생성했기 때문에 초기 DDL만 보면
-- 추천 테이블이 누락된 것처럼 보였다. 새 환경에서도 동일한 스키마를 재현하고
-- 개인과제에서 데이터 흐름을 설명할 수 있도록 명시적인 DDL을 함께 관리한다.
-- user_id/company_id는 user-service, course_id는 course-service 소유 데이터이므로
-- 서비스 간 외래키를 만들지 않는다. 반면 recommendation_id는 같은 추천 서비스
-- 내부 관계이므로 FK와 cascade를 사용해 추천 요청 삭제 시 항목도 함께 정리한다.
CREATE TABLE IF NOT EXISTS recommendations (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    company_id  BIGINT       NOT NULL,
    language    VARCHAR(30)  NOT NULL,
    level       VARCHAR(30)  NOT NULL,
    job         VARCHAR(50)  NOT NULL,
    situation   VARCHAR(50)  NOT NULL,
    goal        TEXT         NOT NULL,
    source      VARCHAR(30)  NOT NULL COMMENT 'AI | RULE_BASED_FALLBACK',
    status      VARCHAR(20)  NOT NULL COMMENT 'SUCCESS | FALLBACK | FAILED',
    created_at  DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    KEY idx_recommendations_user_id (user_id),
    KEY idx_recommendations_company_id (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS recommendation_items (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    recommendation_id   BIGINT      NOT NULL,
    course_id           BIGINT      NOT NULL,
    rank                INT         NOT NULL,
    reason              TEXT        NOT NULL,
    created_at          DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_recommendation_course (recommendation_id, course_id),
    FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 수강생이 수강 신청 (user_id → users.id, course_id → courses.id)
CREATE TABLE IF NOT EXISTS enrollments (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    company_id          BIGINT        NOT NULL COMMENT 'user-service companies.id 논리 참조',
    user_id             BIGINT        NOT NULL COMMENT 'user-service users.id 논리 참조',
    course_id           BIGINT        NOT NULL COMMENT 'course-service courses.id 논리 참조',
    status              VARCHAR(20)   NOT NULL DEFAULT 'ENROLLED' COMMENT 'ENROLLED | LEARNING | COMPLETED',
    progress_rate       DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    enrolled_at         DATETIME(6)   NOT NULL,
    started_at          DATETIME(6),
    completed_at        DATETIME(6),
    created_at          DATETIME(6)   NOT NULL,
    updated_at          DATETIME(6)   NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_enrollment_user_course (user_id, course_id),
    KEY idx_enrollments_company_user (company_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lesson_progress (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    enrollment_id       BIGINT      NOT NULL,
    lesson_id           BIGINT      NOT NULL COMMENT 'course-service lessons.id 논리 참조',
    status              VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED' COMMENT 'NOT_STARTED | LEARNING | COMPLETED',
    started_at          DATETIME(6),
    completed_at        DATETIME(6),
    updated_at          DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_lesson_progress_enrollment_lesson (enrollment_id, lesson_id),
    CONSTRAINT fk_lesson_progress_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS plans (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    name                VARCHAR(100) NOT NULL,
    description         VARCHAR(500),
    status              VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE | INACTIVE',
    created_at          DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_plans_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS plan_prices (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    plan_id             BIGINT      NOT NULL,
    billing_cycle       VARCHAR(20) NOT NULL COMMENT 'MONTHLY | YEARLY',
    price               BIGINT      NOT NULL,
    currency            VARCHAR(10) NOT NULL DEFAULT 'KRW',
    seat_limit          INT         NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE | INACTIVE',
    created_at          DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_plan_price_cycle (plan_id, billing_cycle),
    CONSTRAINT fk_plan_prices_plan FOREIGN KEY (plan_id) REFERENCES plans(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subscriptions (
    id                      BIGINT      NOT NULL AUTO_INCREMENT,
    company_id              BIGINT      NOT NULL COMMENT 'user-service companies.id 논리 참조',
    plan_price_id           BIGINT      NOT NULL,
    status                  VARCHAR(20) NOT NULL COMMENT 'PENDING | ACTIVE | CANCELED | EXPIRED',
    auto_renew              BOOLEAN     NOT NULL DEFAULT TRUE,
    current_period_start    DATETIME(6) NOT NULL,
    current_period_end      DATETIME(6) NOT NULL,
    next_billing_at         DATETIME(6),
    canceled_at             DATETIME(6),
    created_at              DATETIME(6) NOT NULL,
    updated_at              DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_subscriptions_company_status (company_id, status),
    CONSTRAINT fk_subscriptions_plan_price FOREIGN KEY (plan_price_id) REFERENCES plan_prices(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payments (
    id                      BIGINT       NOT NULL AUTO_INCREMENT,
    subscription_id         BIGINT,
    company_id              BIGINT       NOT NULL COMMENT 'user-service companies.id 논리 참조',
    idempotency_key         VARCHAR(100) NOT NULL,
    amount                  BIGINT       NOT NULL,
    currency                VARCHAR(10)  NOT NULL,
    status                  VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | SUCCESS | FAILED',
    provider_payment_id     VARCHAR(255),
    failure_reason          TEXT,
    requested_at            DATETIME(6)  NOT NULL,
    paid_at                 DATETIME(6),
    failed_at               DATETIME(6),
    created_at              DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_payment_company_idempotency_key (company_id, idempotency_key),
    UNIQUE KEY uk_payments_provider_payment_id (provider_payment_id),
    CONSTRAINT fk_payments_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS outbox_events (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    event_id            CHAR(36)    NOT NULL,
    aggregate_type      VARCHAR(50) NOT NULL,
    aggregate_id        BIGINT      NOT NULL,
    event_type          VARCHAR(50) NOT NULL,
    payload             TEXT        NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | PUBLISHED',
    created_at          DATETIME(6) NOT NULL,
    published_at        DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_outbox_event_id (event_id),
    KEY idx_outbox_events_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
