# 팀원 1 `user-service` 구현 계획

> 담당자: 임해안  
> 담당 범위: 기업·회원·직원·초대코드·좌석  
> 문서 상태: 구현 착수 계획

## 1. 문서 목적과 기준

이 문서는 팀원 1의 구현 순서, 서비스 간 선행 계약, 세부 체크리스트와 완료 조건을 정리한다.

요구사항의 기준은 다음 순서로 적용한다.

1. [서비스 기획서](./product-spec.md)의 확정 MVP
2. [API 명세서](./api-spec.md)의 Method, URL, 권한과 응답
3. [ERD](./erd.md)의 데이터 소유권과 제약조건
4. 기존 강사 제공 코드

전체 기능의 공식 완료 현황은 [MVP 체크리스트](./mvp-checklist.md)에서만 관리한다. 이 문서의 체크박스는 작업을 세분화하기 위한 것으로, 코드 구현·테스트·실제 실행·문서 갱신이 끝나기 전에는 공식 MVP 항목을 완료 처리하지 않는다.

## 2. 현재 구현 상태

현재 `user-service`는 강사 제공 실습 코드 상태이며 목표 설계와 차이가 크다.

| 항목 | 현재 코드 | 목표 |
| --- | --- | --- |
| 사용자 모델 | `User`만 존재 | 기업, 사용자, 초대, 구독 권한, 약관, 감사 로그 분리 |
| Role | `STUDENT`, `INSTRUCTOR` | `PLATFORM_ADMIN`, `COMPANY_ADMIN`, `EMPLOYEE` |
| 회원가입 | 클라이언트가 Role 전달 | 가입 종류에 따라 서버가 Role 결정 |
| 보안 | 모든 요청 `permitAll` | 공개/로그인/Role/기업 소속 권한 분리 |
| API | 회원가입, 단건 조회, 내 정보 조회 | 기업·초대·직원·좌석·약관·운영 API |
| 오류 응답 | 대부분 `400`, `success/message/data` | 명세의 오류 코드, HTTP 상태와 공통 응답 |
| 테스트 | 외부 MariaDB에 의존하는 `contextLoads` | 독립적인 서비스 테스트와 Docker 통합 테스트 분리 |
| 초기 DDL | 온라인 강의 예제 구조 | LinguaRoute 기업 구독 도메인 구조 |

### 현재 검증 결과

- [x] `docker compose config --quiet` 성공
- [x] Docker Compose 서비스 목록 확인
- [x] `user-service` `compileJava` 성공
- [ ] `user-service` 테스트 성공
  - 현재 `lecturedb` 호스트를 찾지 못해 `contextLoads`가 실패한다.
- [ ] 현재 저장소의 전체 컨테이너 기동 확인
- [ ] Gateway를 통한 실제 `user-service` 호출 확인

## 3. 작업 원칙

- 다른 서비스의 테이블을 직접 조회하거나 수정하지 않는다.
- `payment-service`가 구독 상태와 구매 좌석 수의 원본을 소유한다.
- `user-service`는 결제 이벤트로 받은 구독 권한 Snapshot과 활성 직원 수를 이용해 가입 가능 여부를 판단한다.
- 기업별 조회·변경은 인증 사용자 ID, Role과 `companyId`를 함께 검사한다.
- 요청 DTO가 Role, 좌석 수, 구독 상태 등 서버 책임 값을 결정하지 못하게 한다.
- 사용자와 기업은 물리 삭제보다 상태 변경을 사용한다.
- 초대코드 원문, 비밀번호, 토큰 등 민감정보를 DB·로그·Kafka 이벤트에 불필요하게 남기지 않는다.
- API 또는 Entity 계약을 변경하면 `api-spec.md`, `erd.md`, `mvp-checklist.md`를 같은 PR에서 갱신한다.

## 4. Git 작업 단위

브랜치는 다음 흐름을 사용한다.

```text
feature/기능명 → dev → main
```

최초 작업 브랜치 생성 예시:

```bash
git checkout main
git pull origin main
git checkout -b dev
git push -u origin dev
git checkout -b feature/user-company
```

권장 작업 브랜치:

| 순서 | 브랜치 | 범위 |
| --- | --- | --- |
| 1 | `feature/user-company` | 인증 계약, 기업·사용자·약관 기반 |
| 2 | `feature/user-invitations` | 초대코드와 관련 감사 로그 |
| 3 | `feature/user-employees` | 구독 권한, 직원 가입·관리, 좌석 |
| 4 | `feature/user-operations` | 플랫폼 관리자 조회와 보안 마무리 |

한 브랜치에 팀원 1의 모든 기능을 구현하지 않는다. 각 브랜치는 관련 테스트와 문서를 포함하여 독립적으로 리뷰 가능한 크기로 유지한다.

## 5. Phase 0 — 실행 환경과 인증 계약 확인

기업 도메인 코드를 변경하기 전에 제공된 Auth Server와 Gateway의 실제 계약을 확인한다.

### 5.1 실행 환경

- [ ] 기존 실습 컨테이너의 이름·포트 충돌 여부 확인
- [ ] 필요하면 기존 실습 환경을 볼륨 삭제 없이 `docker compose down`으로 종료
- [ ] 현재 저장소에서 `docker compose up -d --build` 성공
- [ ] `docker compose ps`에서 필수 서비스가 `Up` 또는 `healthy`
- [ ] Eureka에서 `user-service` 등록 확인
- [ ] `http://localhost:8081/swagger-ui.html` 접속
- [ ] `user-service` 로그에서 MariaDB/Auth/Eureka 연결 오류 확인

### 5.2 Auth Server 호환성 Spike

- [ ] 기존 사용자로 OAuth2 Authorization Code 로그인 성공
- [ ] JWT의 `sub`, 사용자 ID, 이메일, Role, Scope Claim 확인
- [ ] Gateway가 전달하는 `X-User-Id`, `X-User-Email`, `X-User-Role` 확인
- [ ] `COMPANY_ADMIN`, `EMPLOYEE`, `PLATFORM_ADMIN` Role 처리 가능 여부 확인
- [ ] Auth Server가 사용하는 사용자 테이블과 비밀번호 컬럼 확인
- [ ] `user-service`와 Auth Server가 동일한 사용자 ID를 사용하는지 확인
- [ ] 공개 API, 사용자 API, 내부 서비스 API의 인증 방식을 확정

### 5.3 인증 문서 충돌 결정

현재 API 명세는 `POST /api/auth/login`을 정의하지만 제공 Frontend/Auth Server는 `/oauth2/authorize`, `/oauth2/token`을 사용하는 Authorization Code 방식이다.

추천 방향은 제공 OAuth2 흐름을 유지하고 실제 검증 결과에 맞춰 API 명세를 갱신하는 것이다. 별도 로그인 API를 구현하면 Auth Server와 인증 책임이 중복되므로 팀 합의 없이 추가하지 않는다.

확정 전에는 다음 작업을 하지 않는다.

- `users.password` 컬럼명 변경
- 기존 Role의 즉시 삭제
- 별도 JWT 발급 로직 구현
- Frontend에 실제 OAuth Client Secret 추가

## 6. PR 1 — 기업·사용자·약관 기반

### 6.1 Entity와 Repository

- [ ] `Company` Entity/Repository 구현
  - [ ] `id`
  - [ ] `name`
  - [ ] `businessNumber` 유일 제약
  - [ ] `status`: `ACTIVE`, `INACTIVE`
  - [ ] 생성·수정 시각
- [ ] `User` 확장
  - [ ] `companyId`
  - [ ] `status`: `ACTIVE`, `INACTIVE`, `WITHDRAWN`
  - [ ] 목표 Role 반영
  - [ ] 상태 변경 메서드
- [ ] `Term` Entity/Repository 구현
- [ ] `UserAgreement` Entity/Repository 구현
- [ ] `(userId, termId)` 유일 제약 적용

### 6.2 기업 대표계정 회원가입

- [ ] `POST /api/companies` 구현
- [ ] 기업명·사업자번호·관리자 정보 Validation
- [ ] 사업자번호 중복 검사
- [ ] 이메일 중복 검사
- [ ] 요청에 포함된 필수 약관 동의 검사
- [ ] 기업과 관리자 계정을 하나의 트랜잭션으로 생성
- [ ] 서버가 `COMPANY_ADMIN` Role을 강제로 지정
- [ ] 비밀번호 BCrypt 저장
- [ ] 약관 버전과 동의 시각 저장
- [ ] `201 Created`와 API 명세 응답 적용

기업 가입 처리 순서:

```text
사업자번호 중복 검사
→ 이메일 중복 검사
→ 필수 약관 확인
→ Company 생성
→ COMPANY_ADMIN 사용자 생성
→ UserAgreement 저장
```

### 6.3 기업·내 정보 API

- [ ] `GET /api/companies/me`
- [ ] `PATCH /api/companies/me`
- [ ] `GET /api/users/me`
- [ ] `PATCH /api/users/me`
- [ ] `PUT /api/users/me/password`
- [ ] `GET /api/terms/active`
- [ ] `POST /api/users/me/agreements`
- [ ] 다른 기업의 정보 접근 차단
- [ ] 클라이언트가 전송한 사용자 ID 대신 인증 정보 사용

### 6.4 보안

- [ ] 공개 API와 보호 API 분리
- [ ] Swagger/OpenAPI 경로 공개
- [ ] 기업 API에 `COMPANY_ADMIN` 권한 적용
- [ ] 내 정보 API에 로그인 권한 적용
- [ ] 내부 API에 서비스 Scope 적용
- [ ] 일반 사용자의 임의 Role 지정 차단
- [ ] `GET /api/users/{id}` 외부 노출 여부 검토

### 6.5 테스트

- [ ] 기업과 관리자 생성 성공
- [ ] 사업자번호 중복 `409`
- [ ] 이메일 중복 `409`
- [ ] 필수 약관 미동의 실패
- [ ] 중간 실패 시 전체 Rollback
- [ ] 미인증 접근 `401`
- [ ] Role 불일치 `403`
- [ ] 다른 기업 정보 접근 `403`

## 7. PR 2 — 초대코드

### 7.1 Entity와 정책

- [ ] `Invitation` Entity/Repository 구현
- [ ] 상태 정의: `UNUSED`, `USED`, `EXPIRED`, `REVOKED`
- [ ] 생성 기업과 생성자 ID 저장
- [ ] 사용 사용자 ID와 사용 시각 저장
- [ ] 만료 시각 저장
- [ ] 안전한 랜덤 코드 생성
- [ ] 원문 대신 `codeHash` 저장 및 유일 제약 적용
- [ ] 생성·재발급 응답에서만 원문 코드 반환

### 7.2 API

- [ ] `POST /api/companies/me/invitations`
- [ ] `GET /api/companies/me/invitations`
- [ ] `DELETE /api/companies/me/invitations/{invitationId}`
- [ ] `POST /api/companies/me/invitations/{invitationId}/reissue`
- [ ] 다른 기업의 초대코드 조회·폐기 차단
- [ ] 만료된 코드를 응답 시 `EXPIRED`로 처리하는 정책 확정

### 7.3 테스트

- [ ] 정상 생성·목록 조회
- [ ] 코드 Hash 저장 확인
- [ ] 폐기 후 사용 불가
- [ ] 재발급 시 이전 코드 사용 불가
- [ ] 만료 코드 사용 불가
- [ ] 다른 기업 접근 `403`

## 8. PR 3 — 구독 권한·직원 가입·좌석

### 8.1 팀원 4와 이벤트 계약

- [ ] `PaymentCompleted` Topic 이름 확정
- [ ] `eventId`, `companyId`, `subscriptionId`, `seatLimit`, `currentPeriodEnd` 확정
- [ ] 구독 해지·만료 이벤트 정의 여부 확정
- [ ] 이벤트 중복·역순 수신 정책 확정
- [ ] 결제 기능 완성 전 통합 테스트용 구독 권한 생성 방법 합의

### 8.2 `CompanyEntitlement`

- [ ] Entity/Repository 구현
- [ ] 기업별 1개 유일 제약 적용
- [ ] 구독 ID, 상태, 좌석 한도, 기간 종료일 저장
- [ ] 마지막 처리 이벤트 ID 저장
- [ ] `PaymentCompleted` Consumer 구현
- [ ] `eventId` 기준 중복 소비 방지
- [ ] 오래된 이벤트가 최신 상태를 덮어쓰지 않도록 정책 적용

### 8.3 직원 가입

- [ ] `POST /api/employees/signup`
- [ ] 초대코드 존재·상태·만료 검사
- [ ] 기업 존재 및 활성 상태 검사
- [ ] 구독 상태와 기간 검사
- [ ] 활성 직원 수와 좌석 한도 비교
- [ ] 이메일 중복 검사
- [ ] 서버가 `EMPLOYEE` Role을 강제로 지정
- [ ] 직원 약관 동의 저장
- [ ] 초대코드 `USED` 처리
- [ ] 초대코드 또는 관련 행 Lock으로 동시 가입 제어
- [ ] 전체 과정을 하나의 트랜잭션으로 처리

직원 가입 처리 순서:

```text
초대코드 Lock 및 검증
→ 기업 ACTIVE 검사
→ 구독 ACTIVE 및 기간 검사
→ 활성 직원 수와 seatLimit 비교
→ 이메일 중복 검사
→ EMPLOYEE 생성
→ 약관 동의 저장
→ 초대코드 USED 처리
→ 감사 로그 저장
```

필수 오류:

- [ ] `INVITATION_NOT_FOUND`
- [ ] `INVITATION_ALREADY_USED`
- [ ] `INVITATION_EXPIRED`
- [ ] `SUBSCRIPTION_INACTIVE`
- [ ] `SEAT_LIMIT_EXCEEDED`
- [ ] 중복 이메일 오류 코드 확정

### 8.4 직원·좌석 관리 API

- [ ] `GET /api/companies/me/employees`
- [ ] `PATCH /api/companies/me/employees/{userId}/status`
- [ ] `GET /api/companies/me/seats`
- [ ] 활성 직원만 사용 좌석에 포함
- [ ] 비활성화 시 사용 좌석 감소
- [ ] 다른 기업 직원 접근 차단
- [ ] 기업 관리자가 자기 자신을 잘못 비활성화하지 못하도록 정책 적용

좌석 계산:

```text
purchased = CompanyEntitlement.seatLimit
used      = ACTIVE 직원 수
remaining = max(purchased - used, 0)
```

### 8.5 테스트

- [ ] 정상 직원 가입
- [ ] 마지막 좌석 가입 성공
- [ ] 좌석 초과 `409`
- [ ] 동일 초대코드 동시 가입 시 1건만 성공
- [ ] 구독 비활성·만료 `422`
- [ ] 동일 `PaymentCompleted` 중복 수신
- [ ] 직원 비활성화 후 좌석 회수
- [ ] 기업별 직원 데이터 격리

## 9. PR 4 — 운영·감사 로그·보안 마무리

### 9.1 감사 로그

- [ ] `UserAuditLog` Entity/Repository 구현
- [ ] append-only 원칙 적용
- [ ] Actor, Company, Action, Target, 시각 저장
- [ ] 초대 생성·폐기·재발급 기록
- [ ] 직원 가입 기록
- [ ] 직원 비활성화·소속 해제 기록
- [ ] 비밀번호, 토큰, 초대코드 원문 제외

### 9.2 플랫폼 관리자 API

- [ ] `GET /api/admin/users`
- [ ] `GET /api/admin/companies`
- [ ] `GET /api/admin/audit-logs`
- [ ] `PLATFORM_ADMIN` 전용 권한 적용
- [ ] Pagination과 검색 조건 적용 여부 확인

결제와 수강 운영 데이터는 각 소유 서비스가 제공한다. `user-service`에서 결제·수강 테이블을 직접 조회하거나 별도 운영 DB를 만들지 않는다.

### 9.3 공통 응답과 오류

- [ ] 성공 응답을 `data`, `timestamp` 형식으로 통일
- [ ] 오류 응답을 `code`, `message`, `timestamp` 형식으로 통일
- [ ] `400`, `401`, `403`, `404`, `409`, `422`, `500` 구분
- [ ] 도메인 예외를 구체적인 오류 코드로 매핑
- [ ] `System.out.println` 제거 및 안전한 로깅 적용

## 10. 팀원 간 협의 사항

### 팀원 4 — `payment-service`, Frontend

- `PaymentCompleted` 및 구독 해지·만료 이벤트
- 좌석 화면에서 사용할 API 응답
- 기업 가입·초대·직원 관리 화면의 Request/Response
- OAuth2 로그인과 Role별 Route Guard

### 팀원 3 — `enrollment-service`

- 직원의 기업 ID와 상태 조회 내부 API
- 구독 권한에 따른 수강 가능 여부 확인 방식
- 기업 관리자용 직원 수강 상태 API 책임 경계

### 팀원 5 — Gateway·통합 테스트

- Gateway Route
- JWT Claim과 `X-User-*` Header
- 내부 API Scope
- 전체 가입·로그인·결제·초대·수강 E2E 시나리오

## 11. 이번 구현에서 제외할 기능

다음 기능은 현재 구현하지 않는다.

- 이메일 인증
- 아이디 찾기
- 회원 탈퇴
- 환불
- 비밀번호 재설정 요청·확정
- 다른 서비스 테이블 직접 변경
- `user-service` 담당 범위를 벗어난 Frontend 구현

비밀번호 재설정은 확정 MVP지만 전달 채널이 미확정이므로 정책 합의 전까지 보류한다. 로그인·로그아웃은 제공 Auth Server를 우선 사용한다.

## 12. 검증 절차

### 12.1 서비스 테스트

```bash
cd user-service
./gradlew test
./gradlew compileJava
```

현재 테스트는 Docker DB에 의존하므로 첫 PR에서 테스트 프로필을 분리한다. 단위·서비스 테스트는 외부 MariaDB 없이 실행되고, 실제 MariaDB 연동은 Docker 통합 테스트에서 확인하도록 구성한다.

### 12.2 Docker와 API 검증

```bash
docker compose config --quiet
docker compose up -d --build user-service
docker compose ps
docker compose logs --tail=200 user-service
```

검증 항목:

- [ ] Eureka 서비스 등록
- [ ] Swagger 정상·예외 요청
- [ ] API Gateway 경유 요청
- [ ] 미인증 `401`
- [ ] Role 불일치 `403`
- [ ] 기업 데이터 격리
- [ ] Kafka 이벤트 처리 결과
- [ ] 로그의 민감정보 노출 여부

### 12.3 PR 전 확인

```bash
git status
git diff --check
git diff
git diff --cached
```

- [ ] 변경한 파일만 명시적으로 stage
- [ ] 테스트와 실제 API 검증 결과를 PR에 기록
- [ ] API/ERD 변경 사항 반영
- [ ] 완료한 기능만 `mvp-checklist.md`에서 `[x]` 처리

## 13. 최종 완료 기준

- [ ] 기업 대표계정 가입부터 직원 초대·가입까지 Gateway를 통해 동작
- [ ] Auth Server 로그인과 목표 Role이 정상 동작
- [ ] 기업·사용자·초대·좌석 데이터가 기업별로 격리
- [ ] 구독 비활성 또는 좌석 초과 시 직원 가입 차단
- [ ] 동시 가입에도 좌석 한도와 일회용 초대코드 보장
- [ ] 기업·직원 상태 변경과 좌석 회수 동작
- [ ] 약관 동의와 주요 감사 로그 저장
- [ ] 플랫폼 관리자 조회 권한 분리
- [ ] 서비스 테스트와 Docker 통합 실행 통과
- [ ] Swagger, API 명세, ERD, MVP 체크리스트 일치

## 14. 바로 시작할 작업

1. `dev`와 `feature/user-company` 브랜치 생성
2. 기존 실습 컨테이너와 포트 충돌 해결
3. 현재 프로젝트 전체 기동
4. Auth Server JWT Claim과 Gateway Header 확인
5. 테스트 프로필 분리
6. `Company`, 확장 `User`, `Term`, `UserAgreement` 구현
7. `POST /api/companies`와 테스트 구현

첫 번째 구현 목표는 **기업, 기업 관리자와 필수 약관 동의를 하나의 트랜잭션으로 생성하고 Gateway를 통해 검증하는 것**이다.
