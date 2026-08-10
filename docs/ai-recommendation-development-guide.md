# AI 추천 서비스 개발 재개 가이드

## 1. 문서 목적

이 문서는 김지민이 다른 PC나 새 개발 환경에서 `feature/ai-recommendation` 작업을 바로
이어가기 위해 남긴 재개 절차입니다. 이미 해결된 문제의 과정과 기술 선택 배경은 저장소
문서에 반복하지 않습니다. 개인과제용 판단 기록은 현재 PC 바탕화면의 다음 파일에만 있으며
Git 저장소에는 포함되지 않습니다.

```text
C:\Users\MNW\Desktop\AI추천_Gateway_의사결정_기록.md
```

다른 PC에서도 이 기록이 필요하면 위 파일을 개인 저장공간을 통해 별도로 복사합니다. 이 파일이
없어도 개발 재개에는 영향이 없으며, 팀 저장소나 공개 공유 공간에는 업로드하지 않습니다.

담당 범위:

- `recommend-service`의 OpenAI 추천 연동과 장애 fallback 검증
- API Gateway의 추천 경로, 인증 헤더와 내부 API 차단 검증
- user/course/recommend-service 사이의 실제 통합 테스트
- 추천 결과의 MariaDB 저장 확인

확정된 API 계약은 [API 명세서](./api-spec.md), 전체 요구사항은
[서비스 기획서](./product-spec.md)와 [MVP 체크리스트](./mvp-checklist.md)를 우선합니다.

---

## 2. 새 환경에서 저장소와 실행 환경 준비

### 2.1 저장소 받기

```powershell
git clone https://github.com/skala-msa-team/linguaroute-msa.git
cd linguaroute-msa
git fetch origin
git switch feature/ai-recommendation
git pull --ff-only origin feature/ai-recommendation
git status -sb
git log --oneline --decorate -10
```

작업 트리에 본인이 만들지 않은 변경이 있으면 먼저 소유자를 확인합니다. 최신 `dev`는 바로
병합하지 말고 `git fetch origin` 후 변경 파일과 API 계약을 먼저 비교합니다.

### 2.2 Python 환경 만들기

프로젝트 Docker 이미지는 Python 3.12를 사용하므로 새 환경에서도 Python 3.12를 권장합니다.
가상환경은 Git에 포함되지 않으므로 PC마다 새로 생성합니다.

```powershell
cd recommend-service
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m compileall -q app tests main.py
```

macOS 또는 Linux에서는 활성화 명령과 Python 경로만 다음처럼 바꿉니다.

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest -q
python -m compileall -q app tests main.py
```

`.venv`, `.env`, API 키와 Access Token은 Git에 추가하지 않습니다.

### 2.3 남은 작업 확인

현재 실제 실행 환경에서 아직 증명해야 하는 핵심 항목은 다음과 같습니다.

1. 팀 API 키를 사용한 `gpt-5.6-luna` 실제 호출
2. course-service의 내부 API 키 검증
3. Gateway 내부 경로 차단과 인증 헤더 처리
4. Gateway부터 MariaDB까지 전체 추천 흐름

---

## 3. 우선순위 1: 팀용 OpenAI API 키 준비

### 3.1 권장 발급 방식

팀 프로젝트에서는 개인 키보다 OpenAI Platform 프로젝트에 속한 서비스 계정 키를 사용합니다.
프로젝트 또는 조직 Owner가 다음 절차를 진행해야 합니다.

1. [OpenAI API Platform](https://platform.openai.com/)에 로그인합니다.
2. LinguaRoute에서 사용할 프로젝트를 선택하거나 새 프로젝트를 생성합니다.
3. `Settings → Project → Members`로 이동합니다.
4. `+ Service account`를 선택합니다.
5. 이름을 `linguaroute-recommend-service`처럼 용도가 드러나게 지정합니다.
6. 생성 직후 한 번만 표시되는 Secret Key를 팀의 비밀 관리 수단에 저장합니다.

서비스 계정 생성 권한이 없다면 프로젝트 Owner에게 생성을 요청합니다.

- [OpenAI 프로젝트와 서비스 계정 관리](https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform)
- [API 키 생성 위치](https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key)

### 3.2 프로젝트 설정 확인

키를 받기 전에 프로젝트 Owner와 다음 항목을 확인합니다.

- API 결제수단 또는 크레딧이 준비돼 있는가?
- 프로젝트의 월 사용 한도와 알림 기준이 설정돼 있는가?
- 프로젝트에서 `gpt-5.6-luna` 사용이 허용돼 있는가?
- 키 권한을 필요한 추론 요청 범위로 제한할 수 있는가?

ChatGPT 구독과 OpenAI API 결제는 별도입니다. API 키가 있어도 결제나 프로젝트 모델 권한이
없으면 인증·사용 한도 오류가 발생할 수 있습니다.

### 3.3 안전한 주입 방법

API 키를 채팅, 코드, 문서, `docker-compose.yml` 또는 Git 커밋에 입력하지 않습니다.
현재 PowerShell 세션에서만 테스트하려면 다음처럼 환경변수로 설정합니다.

```powershell
$env:OPENAI_API_KEY="발급받은 실제 키"
```

키 값을 출력하지 않고 설정 여부만 확인합니다.

```powershell
if ([string]::IsNullOrWhiteSpace($env:OPENAI_API_KEY)) {
    "OPENAI_API_KEY 설정 안 됨"
} else {
    "OPENAI_API_KEY 설정됨"
}
```

Docker Compose는 실행한 PowerShell 세션의 환경변수를 읽습니다. 키를 설정한 동일한 창에서
Compose를 실행해야 합니다. 키가 유출되면 즉시 폐기하고 새 키를 발급합니다.

- [OpenAI API Quickstart](https://platform.openai.com/docs/quickstart/make-your-first-api-request)
- [API 키 권한 설정](https://help.openai.com/en/articles/8867743)

---

## 4. 우선순위 2: Luna 실제 호출 1회 검증

먼저 전체 MSA와 분리된 최소 스모크 테스트로 OpenAI 연결만 확인합니다. 실제 호출은 비용이
발생하므로 정상 케이스 한 번으로 제한하고 응답 전문이나 API 키를 로그에 남기지 않습니다.

검증 입력:

- 요청 언어: `ENGLISH`
- 수준: `INTERMEDIATE`
- 상황: `CUSTOMER_MEETING`
- 후보: 고정된 `ACTIVE` 영어 강의 1~3개
- 모델: `gpt-5.6-luna`

확인할 결과:

- HTTP 인증과 모델 접근이 성공하는가?
- `OpenAiRecommendationResult` 구조로 파싱되는가?
- 추천 수가 최대 3개인가?
- 반환된 `courseId`가 전달한 후보 안에 있는가?
- 추천 이유가 비어 있지 않은가?

정상 호출 증거로 다음 정보만 기록합니다.

```text
실행 일시
사용 모델
성공 여부
반환된 courseId
구조화 파싱 성공 여부
민감정보를 제거한 오류 코드 또는 요약
```

실제 키나 전체 프롬프트는 증거 자료에 포함하지 않습니다.

---

## 5. 우선순위 3: 신규 내부 API 공통 계약 반영

팀 합의에 따라 신규 내부 API는 `/api/{service}/internal/**`가 아니라
`/internal/{service}/**`로 분리합니다. 공통 규칙은 다른 담당자의 브랜치에서
`AGENTS.md`와 `docs/api-spec.md`에 먼저 작성됐으므로, 해당 변경이 `dev`에 들어온 뒤
문서와 실제 제공 서비스 코드를 함께 확인해야 합니다.

recommend-service에 영향을 주는 경로 변경:

| 대상 | 현재 호출 코드 | 목표 계약 |
|---|---|---|
| Course 추천 후보 | `/api/courses/internal/recommend` | `/internal/courses/recommend` |
| Enrollment 이력 | `/api/enrollments/internal/history/{userId}` | `/internal/enrollments/history/{userId}` |

두 호출 모두 다음 헤더를 전달해야 합니다.

```http
X-Internal-Api-Key: {internalApiKey}
```

### 5.1 Course 담당자 구현 확인

목표 계약:

```http
GET /internal/courses/recommend?language=ENGLISH&excludeIds=3&excludeIds=5
X-Internal-Api-Key: {internalApiKey}
```

필수 동작:

- 키 누락 → `403 Forbidden`
- 키 불일치 → `403 Forbidden`
- 정상 키 → `200 OK`
- 응답은 강의 배열
- 요청 언어와 일치하는 `ACTIVE` 강의만 반환
- 각 항목에 `id`, `title`, `language`, `level`, `situation`, `status` 포함

recommend-service는 이 API를 Gateway를 거치지 않고 course-service에 직접 호출합니다.
Course 담당자의 신규 경로와 키 검증이 준비되기 전에 소비자 URL만 먼저 변경하면 호출이
실패하므로 제공자 변경이 `dev`에 들어온 시점에 함께 맞춥니다.

### 5.2 Enrollment 이력 호출 정리

recommend-service 쪽 계약 반영은 완료했습니다.

1. `/internal/enrollments/history/{userId}`를 직접 호출합니다.
2. `X-Internal-Api-Key` 헤더를 전달합니다.
3. 응답의 `activeCourseIds`를 Course API의 `excludeIds`로 전달합니다.

`activeCourseIds`는 호환성을 위해 유지된 필드명이며 실제 의미는 `ENROLLED`,
`LEARNING`, `COMPLETED` 상태의 강의 ID 전체입니다. 변수명만 보고 현재 수강 중인
강의로 한정하지 말고, 이미 수강 이력이 있는 강의를 모두 제외해야 합니다.
다음 환경에서는 제공 서비스가 같은 계약으로 실행되는지만 통합 테스트합니다.

### 5.3 Payment 변경 영향

구독·결제 담당자 기준으로 현재 payment-service에는 실행 중인 내부 API가 없습니다.
기존 `/api/payments/internal/request`는 제거됐고 새 API는 `/api/plans`,
`/api/subscriptions`, `/api/payments` 외부 보호 API를 사용합니다. 따라서 recommend-service의
직접 수정 대상은 아닙니다.

다만 enrollment-service에 기존 PaymentServiceClient 호출이 남아 있으므로 이 부분은
Enrollment·구독 담당자가 별도로 정리합니다. 앞으로 payment-service에 내부 API가 필요하면
`/internal/payments/**`와 `X-Internal-Api-Key` 계약을 적용합니다.

### 5.4 최신 dev 반영 전 확인

공통 문서와 제공 서비스 변경이 `dev`에 들어오면 다음을 먼저 확인한 후 병합합니다.

```powershell
git fetch origin
git log --oneline HEAD..origin/dev
git diff --name-status HEAD...origin/dev
git diff HEAD...origin/dev -- course-service recommend-service docker-compose.yml
```

특히 다음 충돌을 확인합니다.

- 추천 내부 API 경로 또는 query parameter 변경
- Enrollment 이력 API의 유지·삭제 여부
- `id`와 `courseId` 필드 변경
- 응답 배열과 `data.content` 페이지 구조 혼용
- Course enum 변경
- `INTERNAL_API_KEY` 환경변수 이름 변경

---

## 6. 우선순위 4: Gateway 통합 검증

Gateway 외부 계약:

```text
POST /api/courses/recommendations
→ recommend-service

/api/courses/internal/**
/api/enrollments/internal/**
/api/payments/internal/**
/internal/**
→ 404 Not Found
```

`/api/**/internal/**`는 기존 경로 마이그레이션 기간의 레거시 차단이고, `/internal/**`는
신규 공통 계약의 외부 차단입니다. 신규 경로는 현재 공개 `/api/**` 라우트와 일치하지 않지만,
향후 catch-all 또는 Discovery Locator가 추가돼도 노출되지 않도록 명시적으로 차단합니다.

검증 시나리오:

| 요청 | 기대 결과 |
|---|---|
| 추천 경로 + 정상 직원 토큰 | recommend-service로 전달 |
| 추천 경로 + 토큰 없음/오류 | `401 Unauthorized` |
| `COMPANY_ADMIN` 또는 비활성 직원 | `403 Forbidden` |
| 일반 `/api/courses/**` | course-service로 전달 |
| 외부 `/api/courses/internal/**` | `404 Not Found` |
| 외부 `/api/enrollments/internal/**` | `404 Not Found` |
| 외부 `/api/payments/internal/**` | `404 Not Found` |
| 외부 `/internal/**` | `404 Not Found` |

추가로 외부 클라이언트가 임의의 `X-User-Id`, `X-User-Role`을 보냈을 때 Gateway가 이를
제거하고 검증된 토큰 값으로 덮어쓰는지 확인합니다. 이 동작이 확인되지 않으면 추천 API의
사용자 식별이 안전하다고 판단하지 않습니다.

현재 Gateway는 제공된 이미지로 실행되므로 정적 Compose 테스트만으로 완료 처리하지 않습니다.
실제 컨테이너 요청과 Gateway 로그를 증거로 남깁니다.

---

## 7. 우선순위 5: 전체 MSA 추천 흐름 검증

필요 서비스:

- MariaDB
- Eureka Server
- Auth Server
- API Gateway
- user-service
- course-service
- recommend-service

실행 전 구성 확인:

```powershell
# 저장소 루트에서 실행
docker compose config --quiet
docker compose config --services
docker compose up -d
docker compose ps
```

전체 흐름:

```text
직원 로그인
→ Gateway 토큰 검증 및 사용자 ID 전달
→ recommend-service
→ user-service 최신 businessRole/status/companyId 조회
→ course-service ACTIVE 후보 조회
→ gpt-5.6-luna 구조화 추천
→ 후보 ID·중복·언어·상태 재검증
→ recommendations/recommendation_items 저장
→ Gateway 응답
```

반드시 확인할 시나리오:

| 시나리오 | 기대 결과 |
|---|---|
| `EMPLOYEE + ACTIVE` | 추천 성공 |
| `COMPANY_ADMIN` | `403 Forbidden` |
| `EMPLOYEE + INACTIVE` | `403 Forbidden` |
| 잘못된 language/level/situation | `422 Unprocessable Entity` |
| OpenAI 정상 | `source=AI` |
| OpenAI 인증 오류·timeout | `source=RULE_BASED_FALLBACK` |
| 후보에 없는 courseId | 결과에서 제거 |
| 중복 courseId | 하나만 유지 |
| 다른 언어 또는 `INACTIVE` 강의 | 결과에서 제거 |
| 정상·fallback 결과 | MariaDB에 요청과 항목 저장 |

OpenAI 장애 검증은 정상 호출 이후 실제 키를 폐기하거나 과도한 호출을 만들지 않습니다. 테스트용
잘못된 키 또는 매우 짧은 timeout을 별도 실행 환경에 주입하고, 검증이 끝나면 원래 설정으로
복원합니다.

---

## 8. 개인과제용 증거 수집

통합 테스트 중 다음 자료를 민감정보를 제거한 상태로 저장합니다.

- Luna 정상 추천 응답과 `source=AI`
- OpenAI 오류 시 fallback 응답
- `EMPLOYEE`, `COMPANY_ADMIN`, `INACTIVE` 권한별 응답
- Gateway 내부 경로 `404` 응답
- 정상·fallback 추천의 DB 저장 결과
- user/course/recommend/Gateway의 관련 로그
- 테스트 실행 결과
- 문제 발생 시 수정 전후 코드와 원인 분석

API 키, Access Token, Authorization 헤더, 전체 개인정보는 캡처 전에 가립니다. 구현 완료와 실제
통합 검증 완료를 구분하고, 실행하지 못한 항목은 보고서에 미검증으로 기록합니다.

---

## 9. 완료 기준

다음 조건을 모두 증명한 뒤 AI 추천 MVP 통합 작업을 완료 처리합니다.

- 팀 프로젝트 키로 Luna 실제 호출 성공
- 구조화 출력과 서버 재검증 성공
- `/internal/courses/recommend` 제공 서비스의 내부 키 검증 성공·실패 케이스 확인
- Enrollment 이력의 `activeCourseIds`가 Course 조회의 `excludeIds`로 전달되는지 통합 확인
- Gateway 외부 내부 경로 차단 확인
- Gateway 인증 헤더 위조 방지 확인
- 권한별 `200/401/403/422` 확인
- OpenAI 정상·장애 흐름 확인
- 정상·fallback DB 저장 확인
- 전체 자동 테스트 통과
- [MVP 체크리스트](./mvp-checklist.md) 갱신

검증 후 커밋은 실행 환경, 통합 테스트, 문서 갱신을 논리적으로 분리합니다. 실제 키와 토큰이
staging 영역에 포함되지 않았는지 `git diff --cached`로 반드시 확인한 뒤 push합니다.
