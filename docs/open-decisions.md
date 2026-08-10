# LinguaRoute 구현 결정 및 착수 확인

> 문서 상태: 구현 방침 확정

시간이 제한된 MVP 개발을 위해 기술·정책 선택을 다음과 같이 고정합니다. 팀원과 에이전트는 별도 합의 없이 아래 기준으로 구현하며, 범위를 바꾸려면 기획서·API 명세·ERD를 함께 수정합니다.

## 1. 구현 방침

### 1.1 Auth Server

- 제공 `msa-lecture/auth-server:1.0` 이미지의 로그인·토큰 발급 기능은 우선 재사용합니다.
- 이메일 인증, 아이디 찾기, 비밀번호 변경·재설정 API가 이미지에 없으면 수정 가능한 Auth Server 소스를 확보하여 같은 `auth-server` 책임으로 구현합니다.
- 인증 기능을 `user-service`로 옮기지 않습니다. `user-service`는 사용자 프로필·기업 소속·역할만 소유합니다.
- 착수 확인 담당: 인증·회원 담당, Gateway·통합 담당
- 착수 완료 기준: `/api/auth/*` 각 API의 기존 지원 여부와 수정할 코드 위치를 기록합니다.

### 1.2 데이터베이스

- Docker Compose의 MariaDB 한 개와 공용 `lecture_db` 한 개를 그대로 사용합니다.
- 데이터베이스를 서비스별로 분리하지 않고 필요한 테이블과 컬럼만 추가·변경합니다.
- 공용 DB 안에서도 서비스별 소유 테이블을 구분하고, 다른 서비스의 테이블을 직접 조회·조인하거나 서비스 사이 외래키를 만들지 않습니다.

### 1.3 구독 권한 내부 조회

- `enrollment-service`는 수강신청 전에 `GET /internal/companies/{companyId}/entitlement`로 `user-service`의 최신 이용 권한을 조회합니다.
- 응답에는 `companyId`, `subscriptionStatus`, `seatLimit`, `currentPeriodEnd`를 포함합니다.
- 서비스 간 호출은 환경 변수로 주입한 내부 API 키를 `X-Internal-Api-Key` 헤더에 전달합니다.
- 권한 없음은 `403`, 기업 또는 권한 정보 없음은 `404`, 호출 불가는 `503`으로 처리하며 실패 시 수강신청을 허용하지 않습니다.

### 1.4 결제

- 실제 PG 연동 없이 모의 결제와 구독 기간 관리만 구현합니다.
- 결제 성공·실패는 테스트용 모의 결제 결과로 만들고, 갱신·만료는 `payment-service` 스케줄러가 처리합니다.
- 중복 결제는 `Idempotency-Key`로 방지하고 다섯 가지 구독 이벤트를 Kafka로 발행합니다.

### 1.5 인증 이메일

- 이메일 인증과 비밀번호 재설정은 SMTP 이메일 링크 방식으로 구현합니다.
- 로컬 개발에서는 MailHog 같은 테스트 SMTP를 사용하고, 발신 주소와 SMTP 접속 정보는 환경 변수로 주입합니다.
- 인증·재설정 토큰은 해시로 저장하고 유효시간은 15분, 일회성 사용으로 제한합니다.
- 요청은 이메일별 1분에 1회, 1시간에 5회로 제한하고 계정 존재 여부와 이메일 주소를 응답에 노출하지 않습니다.

### 1.6 AI 추천

- MVP에서는 언어·수준·직무·상황·목표를 이용한 강의 추천만 구현합니다.
- 추가 AI 도구 라우팅은 구현하지 않습니다.
- AI 호출에 실패하면 규칙 기반 추천을 반환하며, 두 방식 모두 `course-service`의 `ACTIVE` 강의와 요청 언어 일치를 검증합니다.

## 2. 공통 확정 사항

- Refresh Token은 구현하지 않고 Access Token 만료 시 재로그인합니다.
- Auth Server가 비밀번호·이메일 인증·아이디 찾기·비밀번호 재설정과 Access Token 발급을 소유합니다.
- 아이디 찾기는 이름과 기업 사업자번호를 조회한 뒤 등록 이메일로만 안내합니다.
- 구독 상태는 `PaymentCompleted`, `PaymentFailed`, `SubscriptionCanceled`, `SubscriptionExpired`, `SubscriptionRenewed` 이벤트로 전달합니다.
- Kafka 소비자는 `processed_event` 테이블의 `eventId`로 중복 처리를 방지합니다.
