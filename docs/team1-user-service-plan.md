# 팀원 1 `user-service` 작업 계획

> 담당자: 임해안
>
> 담당 영역: 기업·회원·직원·초대코드·좌석
>
> 작업 브랜치: `feature/user-company`
>
> 기준 문서: `docs/product-spec.md`, `docs/api-spec.md`, `docs/erd.md`, `docs/mvp-checklist.md`

## 1. 확정된 인증·데이터 경계

- 기존 Auth Server는 OAuth2 로그인과 Access Token 발급을 그대로 담당한다.
- `user-service`는 공용 `users` 테이블과 비밀번호 해시, 이메일 인증, 아이디 찾기, 비밀번호 변경·재설정을 소유한다.
- `users.role`은 Auth Server 호환용이며 `STUDENT`, `INSTRUCTOR`만 저장한다.
- 실제 서비스 권한은 `users.business_role`의 `PLATFORM_ADMIN`, `COMPANY_ADMIN`, `EMPLOYEE`로 판단한다.
- `EMPLOYEE`는 `STUDENT`, `COMPANY_ADMIN`과 `PLATFORM_ADMIN`은 `INSTRUCTOR`로 매핑한다.
- 보호 API는 Access Token의 기존 Role을 비즈니스 권한으로 신뢰하지 않고 사용자 ID로 최신 상태·소속·비즈니스 역할을 조회한다.
- 내부 권한 조회는 `X-Internal-Api-Key`를 사용하는 `/internal/users/{userId}/authorization-context`로 제공한다.

## 2. 현재 작업 상태

### 저장소·브랜치

- [x] `feature/user-company` 브랜치 생성
- [x] 최신 `origin/main`의 인증 서버 유지 방침 반영
- [x] 기존 작업 복원 후 충돌 없음 확인
- [x] 변경사항 커밋
- [x] 원격 기능 브랜치 푸시
- [x] Base `dev`, Compare `feature/user-company` Pull Request 생성 및 병합

### 이번 구현 범위

- [x] `Company`, `User`, `Term`, `UserAgreement` Entity와 Repository
- [x] Auth 호환 역할과 비즈니스 역할 분리
- [x] `users.password` BCrypt 해시 저장
- [x] 기업·관리자·약관 동의 트랜잭션 처리
- [x] 일회용 이메일 인증 토큰 해시 검증·소비
- [x] 공개 `POST /api/companies`
- [x] `GET/PATCH /api/companies/me`
- [x] `GET/PATCH /api/users/me`
- [x] `GET /api/terms/active`
- [x] `POST /api/users/me/agreements`
- [x] 내부 사용자 권한 조회와 API 키 검증
- [x] 공통 성공·오류 응답 및 주요 예외 상태 코드
- [ ] 이메일 인증 요청·6자리 코드 확인·SMTP 발송
- [ ] Gateway를 통한 OAuth2 로그인 후 보호 API 호출
- [ ] 회원 탈퇴와 비밀번호 변경·재설정

## 3. 기업 대표계정 가입 처리

외부 계약:

```http
POST /api/companies
```

처리 순서:

```text
요청 형식 검사
→ 사업자번호·이메일 중복 검사
→ 현재 필수 약관 동의 검사
→ 이메일과 일치하는 인증 완료 토큰 검사
→ 인증 토큰 일회용 소비
→ Company 저장
→ BCrypt 비밀번호와 Auth 호환 역할 INSTRUCTOR 저장
→ 비즈니스 역할 COMPANY_ADMIN 저장
→ 약관 버전과 동의 시각 저장
→ 201 Created
```

위 처리는 하나의 DB 트랜잭션에서 실행한다. 기업·사용자·약관 저장이 실패하면 이메일 인증 토큰 소비도 함께 롤백되어야 한다.

검증 항목:

- [x] 사업자번호의 하이픈 제거 및 유일성 검사
- [x] 이메일 소문자 정규화 및 유일성 검사
- [x] 필수 약관 누락 시 `422 REQUIRED_AGREEMENT_MISSING`
- [x] 잘못된 이메일 인증 토큰이면 `422 INVALID_EMAIL_VERIFICATION`
- [x] 비밀번호 원문 미저장 및 BCrypt 일치 확인
- [x] 응답 Role은 실제 비즈니스 역할 `COMPANY_ADMIN`
- [x] 중복 사업자번호·이메일 `409`

## 4. 권한 처리

### 외부 보호 API

- JWT의 `userId`, `user_id`, 숫자형 `sub` 순서로 사용자 ID를 찾는다.
- DB에서 사용자의 최신 `status`, `businessRole`, `companyId`를 다시 확인한다.
- 기업 API는 `ACTIVE` 상태이며 `COMPANY_ADMIN`이고 소속 기업이 있는 사용자만 허용한다.
- 비활성 또는 탈퇴 사용자는 `403 USER_INACTIVE`로 거부한다.

### 내부 권한 조회

```http
GET /internal/users/{userId}/authorization-context
X-Internal-Api-Key: ${INTERNAL_API_KEY}
```

- [x] 올바른 키이면 `userId`, `companyId`, `businessRole`, `status` 반환
- [x] 키가 없거나 다르면 `403 INVALID_INTERNAL_API_KEY`
- [x] 이 경로는 OAuth2 Scope에 의존하지 않음
- [ ] Gateway 외부 라우트에 노출되지 않는지 통합 확인

## 5. 검증 현황

### 자동 검증

- [x] `./gradlew compileJava compileTestJava`
- [x] `./gradlew test --rerun-tasks`
- [x] Controller 통합 테스트 14개 성공
- [x] 약관 서비스 테스트 1개 성공
- [x] Spring Context 테스트 1개 성공
- [x] 총 16개, 실패·오류·건너뜀 0개
- [x] `git diff --check`
- [x] `docker compose config --quiet`

### 실제 실행 검증

- [x] 최신 코드로 `user-service` 검증 이미지 재빌드
- [x] 격리 MariaDB에서 최신 DDL 적용 확인
- [x] `/actuator/health` `200 UP`
- [x] `/api-docs` `200`, Swagger UI Redirect `302` 확인
- [x] 인증 완료 토큰 준비 후 기업가입 `201`
- [x] `users.password` BCrypt, `role=INSTRUCTOR`, `business_role=COMPANY_ADMIN` 확인
- [x] 인증 토큰 `used_at`, 기업·사용자·약관 동의 저장 확인
- [x] 잘못된 토큰 `422`, 중복 가입 `409`, 실패 요청 Rollback 확인
- [x] 내부 API 키 성공 `200`, 누락·오류 `403`
- [x] 기존 Auth Server로 생성 사용자의 OAuth2 로그인 확인
- [x] Authorization Code와 Access Token 발급 확인
- [x] 기존 Auth 토큰으로 `/api/users/me`, `/api/companies/me` `200` 확인
- [x] 발급된 토큰이 있어도 비활성 사용자는 `403 USER_INACTIVE` 확인
- [ ] Gateway 경유 외부 경로 확인

기존 Auth Server는 현재 Access Token과 함께 Refresh Token도 반환한다. 확정 MVP 문서는 Refresh Token을 사용하지 않는다고 정의하므로 프론트엔드는 이를 저장·사용하지 않아야 하며, 기존 Auth 이미지를 수정하지 않는 방침과의 차이는 팀에 공유해야 한다.

## 6. `dev` 병합 후 필수 주의사항

### 공용 초기 DDL 충돌

- 최신 `origin/dev`를 병합한 상태에서 `course-service`의 `Course.Category` 참조 6건으로 `compileJava`가 실패한다.
- 이 실패는 `feature/user-company` 변경이 아니라 현재 `dev`의 강의 Entity와 Controller·Service·Repository 계약 불일치이며 `feature/course-domain-fix`가 수정 중이다.
- `feature/course-domain-fix`도 `init-db/01_init.sql`의 `courses` 정의를 변경한다.
- 해당 브랜치와 `feature/user-company`의 병합 시뮬레이션에서 같은 파일의 충돌을 확인했다.
- 충돌 해결 시 이 브랜치가 추가한 `companies`, 사용자 확장 컬럼, `email_verifications`, `terms`, `user_agreements`를 유지해야 한다.
- 동시에 강의 담당 브랜치의 외국어 강의 컬럼 `language`, `situation`, `level`, `status`를 유지하고 기존 `category`, `price`, `instructor_id`, `enrollment_count` 정의는 제거해야 한다.

### 기존 `users` 데이터 마이그레이션

- 기존 데이터가 있는 DB에서 `ddl-auto=update`로 실행하면 MariaDB가 새 `business_role`의 첫 enum 값인 `COMPANY_ADMIN`을 모든 기존 사용자에게 자동 입력한다.
- 실제 로컬 공유 DB의 기존 사용자 4건과 동일한 구조로 격리 검증하여 이 동작을 확인했다.
- 기존 `INSTRUCTOR`만으로는 `PLATFORM_ADMIN`과 `COMPANY_ADMIN`을 구분할 수 없고, 기존 `STUDENT`에는 필수 `company_id`가 없으므로 자동 매핑하면 안 된다.
- 통합 환경의 `user-service`를 재빌드하기 전에 다음 중 하나를 팀에서 합의해야 한다.
  1. 개발 DB 볼륨을 초기화하고 새 DDL로 재생성한다.
  2. 새 컬럼을 nullable로 추가하고 사용자별 `business_role`, `status`, `company_id`를 명시적으로 보정한 뒤 제약조건을 적용한다.
- `docker compose down -v`는 팀 데이터를 삭제하므로 합의와 백업 없이 실행하지 않는다.
- 기존 볼륨에는 `init-db/01_init.sql`이 다시 실행되지 않으므로 파일 병합만으로 기존 DB가 정상 마이그레이션되지는 않는다.

### 기존 Auth Server 제한

- 기존 Auth Server는 확정 MVP 문서와 달리 Refresh Token도 반환한다.
- 프론트엔드는 Refresh Token을 저장하거나 사용하지 않고, 정책 차이는 팀 결정사항으로 남긴다.

## 7. 다음 개발 순서

### PR 1 — 기업 계정 기반 마무리

1. 이메일 인증 요청·확인 API와 MailHog SMTP 연동
2. Gateway 공개·보호 라우팅 검증
3. 기존 Auth Server의 Refresh Token 반환과 MVP 문서 차이 팀 합의
4. 관련 API·ERD·MVP 체크리스트 갱신

### PR 2 — 초대코드·직원 가입

- [ ] `Invitation` Entity와 해시 코드 생성
- [ ] 생성·목록·폐기·재발급 API
- [ ] 만료·일회성·동시 사용 방지
- [ ] 이메일 인증·필수 약관을 포함한 직원 가입
- [ ] Auth 호환 `STUDENT`, 비즈니스 역할 `EMPLOYEE` 저장

### PR 3 — 구독 권한·좌석

- [ ] `CompanyEntitlement`, `ProcessedEvent`
- [ ] 결제·구독 Kafka 이벤트 멱등 소비
- [ ] 활성 직원 기준 좌석 사용량 계산
- [ ] 직원 가입 시 구독 활성·잔여 좌석 검사
- [ ] 내부 구독 권한 조회 API

### PR 4 — 회원·운영 기능

- [ ] 직원 목록과 상태 변경
- [ ] 비밀번호 변경·재설정
- [ ] 아이디 찾기
- [ ] 회원 탈퇴와 로그인 불가 비밀번호 교체
- [ ] 플랫폼 관리자용 기업·사용자 상태 조회

## 8. 커밋·PR 전 체크

```bash
git status
git diff --check
git diff
./gradlew test --rerun-tasks
docker compose config --quiet
```

- 작업 범위의 파일만 명시적으로 스테이징한다.
- 기능 구현·테스트·실제 실행·관련 문서가 모두 끝난 MVP 항목만 `[x]`로 변경한다.
- 커밋과 푸시는 사용자 확인 후 진행한다.
