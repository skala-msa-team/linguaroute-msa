# MVP 통합 검증 기록

> 검증일: 2026-08-11 · 대상: 로컬 Docker Compose, API Gateway(`http://localhost:8080`), MailHog, Vue 브라우저 화면

이 문서는 팀 공유용 실행 검증 기록이다. 체크리스트의 `[x]`는 구현·테스트·실행 확인이 끝난 항목만 의미하며, 아직 화면이 목업인 영역은 API 완료와 별도로 표시한다.

## 실행 결과

| 영역 | 확인 내용 | 결과 |
| --- | --- | --- |
| OAuth2 로그인 | Auth Server Authorization Code를 Gateway에서 교환해 관리자·직원·플랫폼 관리자 JWT 발급 | 통과 |
| 이메일 인증 | 인증 요청 `202`, MailHog 수신, 코드 확인 `200`, 같은 코드 재사용 `422` | 통과 |
| 기업·사용자 | 기업/내 정보, 약관, 직원·좌석·초대 목록의 역할별 Gateway 조회 | 통과 |
| 초대코드 | 생성 `201`, 재발급 `201`, 폐기 `204`, 유효 기간 오류 `400` | 통과 |
| 구독·결제 조회 | 요금제, 현재 구독, 결제 이력 | 통과 |
| 결제 이벤트 | `PaymentCompleted`, `PaymentFailed`, `SubscriptionCanceled`, `SubscriptionExpired`, `SubscriptionRenewed` Outbox 생성 및 entitlement 소비 단위 테스트 | 통과 |
| 강의 | 목록/검색/필터/상세/차시 조회와 관리자 차시 등록 | 통과 |
| 수강·학습 | 수강신청 `201`, 중복 `409`, 차시 시작 `200`, 완료·진도율·수료 `200` | 통과 |
| 수강 권한 | 직원의 기업 API `403`, 플랫폼 관리자의 내 수강 목록 `403` | 통과 |
| 기업 수강 관리 | 직원별 수강 상태·진도율 조회 | 통과 |
| 브라우저 | 수강 플레이어 및 라이브 기업 가입 화면 렌더링 | 통과 |

## 실제 Gateway 검증 경로

```text
GET  /api/terms/active
GET  /api/companies/me
GET  /api/users/me
GET  /api/companies/me/invitations
GET  /api/companies/me/employees
GET  /api/companies/me/seats
GET  /api/plans
GET  /api/subscriptions/me
GET  /api/payments
GET  /api/courses?keyword=...&language=...&situation=...&level=...
GET  /api/courses/{courseId}
GET  /api/courses/{courseId}/lessons
GET  /api/enrollments/me
GET  /api/companies/me/enrollments
GET  /api/companies/me/enrollments/progress
```

## 이번 검증에서 수정한 사항

- 강의 차시·수강·진도율 API와 Gateway 라우팅을 구현하고, 모든 수강 관련 상태를 서버가 계산하도록 정리했다.
- 수강 목록·상세도 최신 `EMPLOYEE` 권한을 내부 조회해 차단하도록 보완했다.
- 기업 가입 화면이 목업 토큰을 사용하던 문제를 수정해, 라이브 모드에서 실제 이메일 인증 API를 호출하고 검증 토큰을 사용하도록 변경했다.
- 강의 목록, 상세, 내 학습, 학습 플레이어, 기업 진도 화면에 라이브 API 연결을 추가했다.
- API 문서의 수강·학습 응답과 README 통신 흐름을 구현과 맞췄다.

## 팀 공유 전 인지할 제한

- 기본 프론트 환경 변수는 데모 화면 보존을 위해 `VITE_USE_LIVE_API=false`다. 실제 API 연동 화면을 확인하려면 `true`로 설정해야 한다.
- 구독 화면, 일부 대시보드·운영 화면, AI 추천 화면은 아직 목업 데이터가 남아 있다. API 구현 완료와 화면 연동 완료를 같은 의미로 공유하면 안 된다.
- AI 추천은 API 계약과 내부 호출 경로가 현재 설계와 다르므로 확정 MVP 완료 항목이 아니다.
- 현재 검증 DB에는 API 검증용 강의·차시·수강 및 초대코드 데이터가 추가되어 있다. 제출 전에는 깨끗한 볼륨에서 초기화·재검증한다.

## 재현 명령

```bash
cd user-service && ./gradlew test
cd ../payment-service && ./gradlew test
cd ../course-service && ./gradlew test
cd ../enrollment-service && ./gradlew test
cd ../vue-frontend && npm run build
cd .. && docker compose config --quiet
```
