# AI 추천 서비스 개발 인수인계 가이드

## 1. 문서 목적

이 문서는 김지민 담당 영역인 `recommend-service`의 현재 개발 상태와 집에서 이어서 진행할 작업을 정리합니다.

기준 브랜치와 담당 범위는 다음과 같습니다.

- 작업 브랜치: `feature/ai-recommendation`
- 담당 서비스: `recommend-service`
- 담당 기능: AI 강의 추천, API Gateway 연동, 통합 테스트
- 외부 API: OpenAI API 도입 예정
- 현재 AI 방식: 로컬 추천 제공자와 규칙 기반 대체 추천

프로젝트 전체 확정 요구사항은 다음 문서를 우선합니다.

- [서비스 기획서](./product-spec.md)
- [API 명세서](./api-spec.md)
- [ERD](./erd.md)
- [MVP 체크리스트](./mvp-checklist.md)
- [구현 결정 및 착수 확인](./open-decisions.md)

---

## 2. 현재까지 완료된 작업

### 2.1 추천 API

외부 API 계약은 다음과 같습니다.

```http
POST /api/courses/recommendations
Authorization: Bearer {accessToken}
```

요청 예시:

```json
{
  "language": "ENGLISH",
  "level": "INTERMEDIATE",
  "job": "GLOBAL_SALES",
  "situation": "CUSTOMER_MEETING",
  "goal": "제품을 자연스럽게 설명하고 싶음"
}
```

현재 구현된 처리 흐름:

```text
추천 요청 수신
→ 직원 권한 확인
→ course-service에서 추천 후보 조회
→ ACTIVE 상태와 요청 언어가 일치하는 강의만 유지
→ 추천 제공자 실행
→ 존재하지 않는 강의와 중복 결과 제거
→ 최대 3개 추천
→ 추천 요청과 추천 항목 저장
→ 공통 응답 형식 반환
```

### 2.2 추천 제공자

`RecommendationProvider` 경계를 두고 현재 `LocalAiRecommendationProvider`를 사용합니다.

- 외부 LLM 없이 후보 강의의 수준과 상황을 비교합니다.
- 외부 제공자로 교체할 수 있도록 추천 서비스와 분리돼 있습니다.
- 제공자 오류 또는 유효 결과 부재 시 규칙 기반 추천으로 전환합니다.
- 폴백 결과는 `RULE_BASED_FALLBACK`으로 구분합니다.

### 2.3 결과 검증

추천 제공자가 반환한 값을 그대로 신뢰하지 않습니다.

- `course-service`가 반환한 실제 후보에 포함된 강의인지 확인
- 강의 상태가 `ACTIVE`인지 확인
- 요청 언어와 강의 언어가 일치하는지 확인
- 중복 강의 제거
- 추천 이유가 비어 있지 않은지 확인
- 최대 추천 수를 3개로 제한

### 2.4 데이터 소유권

`recommend-service`가 다음 테이블을 소유합니다.

- `recommendations`
- `recommendation_items`

`user_id`, `company_id`, `course_id`는 다른 서비스에 대한 논리 참조입니다. 다른 서비스 테이블과 직접 조인하거나 서비스 사이 외래키를 만들지 않습니다.

### 2.5 테스트와 실행 구성

현재 다음 항목을 검증하는 테스트 5개가 있습니다.

- 정상 추천 응답
- 활성 상태 및 언어 검증
- 존재하지 않는 강의와 중복 강의 제거
- 추천 제공자 장애 시 규칙 기반 폴백
- 직원 권한과 Gateway 인증 헤더

API Gateway에서는 `/api/courses/recommendations`가 일반 강의 경로보다 먼저 `recommend-service`로 전달되도록 Compose 환경 설정을 추가했습니다. 다만 제공된 Gateway 이미지에서 실제 라우팅과 인증 헤더 전달이 동작하는지는 아직 검증하지 않았습니다.

---

## 3. 삭제하거나 대체한 과거 작업

과거 작업이 단순히 불필요해서 삭제된 것은 아닙니다. 최신 역할 분담과 MSA 데이터 소유권에 맞지 않는 위치에 있거나 다른 담당자의 영역이었기 때문에 분리 또는 대체했습니다.

### 3.1 삭제한 다른 담당자 영역

- `course-service`의 언어·난이도·상황 필드 변경
- Vue 추천 화면과 공통 UI
- 프론트엔드 잠금 의존성 갱신

위 작업은 각각 강의 담당자와 프론트엔드 담당자의 영역이므로 김지민 브랜치에서 제거했습니다.

### 3.2 대체한 추천 구현

이전에는 추천 엔티티와 로직이 `course-service` 안에 구현돼 있었습니다. 최신 설계에서는 `recommend-service`가 추천 요청과 결과를 소유하므로 해당 구현과 테스트를 사용하지 않습니다.

추천 기능의 아이디어와 검증 방식은 버리지 않고 현재 `recommend-service` 구현으로 옮겨 다음 커밋으로 대체했습니다.

- `9a25ab9` `feat(recommendation): AI 강의 추천 기능 구현`
- `801beaa` `test(recommendation): 추천 처리와 API 계약 검증 추가`
- `74c3869` `chore(gateway): 추천 API 라우팅과 실행 환경 연결`

---

## 4. 집에서 개발 환경 준비

### 4.1 저장소와 브랜치 받기

```bash
git clone https://github.com/skala-msa-team/linguaroute-msa.git
cd linguaroute-msa
git fetch origin
git switch feature/ai-recommendation
git pull --ff-only origin feature/ai-recommendation
```

작업을 시작하기 전에 확인합니다.

```bash
git status -sb
git log --oneline --decorate -10
```

### 4.2 Python 환경

프로젝트 Docker 이미지는 Python 3.12를 사용합니다. 로컬에서도 Python 3.11 또는 3.12 사용을 권장합니다. Python 3.14에서는 현재 고정된 Pydantic 버전의 설치가 실패할 수 있습니다.

```bash
cd recommend-service
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest -q
python -m compileall -q .
```

`.venv`와 API 키가 포함된 환경 파일은 커밋하지 않습니다.

### 4.3 Docker 실행 자료

최신 `main`에는 Auth Server와 API Gateway 이미지 조각이 포함돼 있습니다. 자세한 복원 및 실행 방법은 루트 [README](../README.md)를 따릅니다.

구성만 먼저 확인할 수 있습니다.

```bash
docker compose config --quiet
docker compose config --services
```

---

## 5. 가장 먼저 확인할 서비스 계약

### 5.1 Access Token 클레임

최신 문서에서는 Auth Server가 Access Token에 다음 값을 포함하도록 확정했습니다.

```text
userId
companyId
role
```

현재 추천 구현은 Gateway 헤더에서 사용자 ID와 역할을 받고 `user-service`를 다시 호출해 기업 ID를 조회합니다. 실제 토큰에 세 클레임이 포함된다면 다음 구조로 단순화하는 작업을 우선 검토합니다.

```text
Bearer Token 검증
→ userId, companyId, role 추출
→ EMPLOYEE 권한 검사
→ 추천 서비스 실행
```

확인할 사항:

- 실제 발급 토큰에 `userId`, `companyId`, `role`이 있는가?
- API Gateway가 어떤 `X-User-*` 헤더를 전달하는가?
- `recommend-service`가 토큰을 직접 검증할지 Gateway의 검증 결과를 신뢰할지?
- 비활성 직원 또는 기업 소속 불일치를 어느 서비스에서 차단할지?

### 5.2 course-service 후보 조회

추천 기능은 `course-service`가 실제로 다음 필터와 응답을 제공해야 완성됩니다.

```http
GET /api/courses?language=ENGLISH&status=ACTIVE
```

필요한 최소 응답 필드:

```json
{
  "courseId": 12,
  "title": "해외 고객 미팅 영어",
  "language": "ENGLISH",
  "level": "INTERMEDIATE",
  "situation": "CUSTOMER_MEETING",
  "status": "ACTIVE"
}
```

강의 담당자와 다음을 확인합니다.

- 식별자 이름이 `id`인지 `courseId`인지
- 응답이 배열인지 `data.content` 페이징 구조인지
- 언어·수준·상황·상태 필드가 포함되는지
- `language`와 `status` 필터를 서버에서 적용하는지
- 서비스 간 요청에 사용자 토큰 또는 내부 인증이 필요한지

현재 `CourseServiceClient`는 최신 명세의 `data.content` 페이징 구조에 맞춘 보완이 필요할 수 있습니다.

### 5.3 API Gateway 담당 범위

API Gateway 연동과 서비스 통합 테스트는 김지민 담당입니다. 단순히 추천 API URL을 추가하는 것뿐 아니라 인증과 라우팅 경계를 실제 실행 환경에서 확인해야 합니다.

#### 추천 경로 우선 라우팅

추천 API는 외부 계약상 `/api/courses` 하위 경로지만 `course-service`가 아니라 `recommend-service`가 처리합니다. 따라서 구체적인 추천 경로가 일반 강의 경로보다 먼저 평가돼야 합니다.

```text
/api/courses/recommendations/**
→ recommend-service

/api/courses/**
→ course-service
```

현재 `docker-compose.yml`에 이 우선순위를 설정했지만 실제 Gateway 이미지에서 환경변수로 기존 라우트가 정상 재정의되는지 확인해야 합니다.

#### 인증과 클레임 전달

Gateway는 외부 요청의 Bearer Token을 검증하고, 인증되지 않은 요청은 `401 Unauthorized`로 차단해야 합니다. 추천 API는 직원 전용이므로 `EMPLOYEE`가 아닌 사용자는 `403 Forbidden`으로 거부해야 합니다.

팀에서 다음 두 방식 중 하나를 확정합니다.

1. Gateway가 토큰을 검증한 뒤 `X-User-Id`, `X-Company-Id`, `X-User-Role`을 신뢰할 수 있는 내부 헤더로 만들어 전달
2. Gateway가 토큰 유효성만 검증하고 `recommend-service`가 같은 토큰에서 필요한 클레임을 추출

Gateway 헤더 방식을 사용할 때는 클라이언트가 임의로 보낸 `X-User-*` 헤더를 제거하고, 검증한 토큰 값으로 덮어써야 합니다. 실제 제공 이미지가 `companyId`까지 전달하지 못하면 Gateway 소스 또는 설정을 수정할 수 있는지 확인해야 합니다.

#### Gateway 통합 검증

- 직원 토큰으로 추천 요청 시 `200 OK`
- 기업 관리자 또는 플랫폼 관리자 토큰으로 요청 시 `403 Forbidden`
- 토큰이 없거나 잘못된 경우 `401 Unauthorized`
- 추천 경로가 `recommend-service`로 전달되는지 확인
- 일반 강의 경로가 계속 `course-service`로 전달되는지 확인
- OpenAI 장애 시 Gateway를 통해 규칙 기반 폴백 응답이 반환되는지 확인
- Gateway 외부 응답이 API 명세의 `{ data, timestamp }` 형식과 일치하는지 확인

---

## 6. OpenAI API 연결 계획

### 6.1 ChatGPT와 API의 차이

서비스 코드에서 연결하는 것은 ChatGPT 웹 화면이 아니라 OpenAI API입니다. ChatGPT 구독과 API 결제는 별도로 관리되며 API 사용량은 별도로 과금됩니다.

- [OpenAI API Quickstart](https://platform.openai.com/docs/quickstart/make-your-first-api-request)
- [ChatGPT와 API 결제 구분](https://help.openai.com/en/articles/9039756-billing-settings-in-chatgpt-vs-platform)
- [OpenAI 모델 목록](https://developers.openai.com/api/docs/models)

### 6.2 제공자 구조

현재 경계를 유지하고 새 구현체를 추가합니다.

```text
RecommendationProvider
├── OpenAiRecommendationProvider
└── LocalAiRecommendationProvider
```

정상 및 장애 흐름:

```text
OpenAI 호출 성공
→ 서버 검증
→ source=AI

OpenAI 시간 초과·요금 한도·인증 오류·형식 오류
→ 규칙 기반 추천
→ source=RULE_BASED_FALLBACK
```

### 6.3 모델 선택

추천 작업은 제공된 후보 중 최대 3개를 고르는 제한된 작업이므로 가장 비싼 모델부터 사용할 필요는 없습니다.

MVP 시작 모델 후보:

- `gpt-4o-mini`: 낮은 비용과 구조화 출력 지원을 우선할 때
- `gpt-5.6-luna`: 최신 모델 계열에서 비용 효율을 우선할 때
- `gpt-5.6-terra`: 추천 이유 품질과 비용 균형을 높이고 싶을 때

모델은 코드에 고정하지 않고 `OPENAI_MODEL` 환경변수로 교체 가능하게 만듭니다. 실제 팀 계정에서 사용할 수 있는 모델과 현재 가격은 구현 시 공식 모델 페이지에서 다시 확인합니다.

### 6.4 환경변수

실제 값은 저장소에 기록하지 않습니다.

```text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT_SECONDS=5
OPENAI_MAX_RETRIES=1
```

API 키는 `recommend-service` 서버에서만 사용합니다. 브라우저 코드, Git 저장소, 로그, API 응답에 노출하지 않습니다.

### 6.5 OpenAI에 전달할 데이터

LLM이 존재하지 않는 강의를 만들지 않도록 `course-service`에서 받은 후보만 전달합니다.

```json
{
  "employeeProfile": {
    "language": "ENGLISH",
    "level": "INTERMEDIATE",
    "job": "GLOBAL_SALES",
    "situation": "CUSTOMER_MEETING",
    "goal": "제품을 자연스럽게 설명하고 싶음"
  },
  "candidateCourses": [
    {
      "courseId": 12,
      "title": "해외 고객 미팅 영어",
      "language": "ENGLISH",
      "level": "INTERMEDIATE",
      "situation": "CUSTOMER_MEETING"
    }
  ]
}
```

구조화된 출력 예시:

```json
{
  "recommendations": [
    {
      "courseId": 12,
      "reason": "해외영업 직무와 고객 미팅 목표에 적합합니다."
    }
  ]
}
```

응답은 저장 전에 실제 후보 ID, 중복 여부, 추천 이유와 최대 개수를 서버에서 다시 검증합니다.

### 6.6 비용과 장애 방어

- 요청당 후보 강의 최대 20개
- 추천 결과 최대 3개
- 출력 토큰 제한
- API 제한시간 3~5초
- 재시도 최대 1회
- 실패 시 규칙 기반 폴백
- API 키, 전체 프롬프트와 민감한 입력을 로그에 남기지 않음
- 모델명, 응답 시간, 토큰 사용량, 성공·폴백 여부만 운영 로그로 기록
- API 플랫폼의 자동 충전과 월 사용 한도를 팀 예산에 맞게 설정

---

## 7. 앞으로 진행할 작업 순서

### 우선순위 1: 인증과 서비스 계약

1. 실제 Access Token의 `userId`, `companyId`, `role` 확인
2. 추천 API 인증 처리를 최신 토큰 계약에 맞게 수정
3. `course-service` 실제 후보 조회 응답 확인
4. `data.content` 등 실제 응답 구조를 `CourseServiceClient`에 반영
5. 서비스 호출 실패 시 오류 코드와 폴백 범위 확정

### 우선순위 2: OpenAI API

1. 공식 Python OpenAI SDK 의존성 추가
2. `OpenAiRecommendationProvider` 구현
3. 환경변수 기반 모델·제한시간·재시도 설정
4. 후보 강의만 포함하는 프롬프트 작성
5. 구조화 출력 적용
6. 반환된 ID를 기존 검증 로직으로 재검증
7. OpenAI 실패 시 기존 규칙 기반 폴백 유지

### 우선순위 3: 테스트

실제 서비스 실행에서는 OpenAI API를 호출합니다. 반복 실행되는 단위·자동 테스트에서는 비용과 외부 네트워크 의존성을 줄이고 결과를 재현할 수 있도록 OpenAI 클라이언트를 가짜 응답으로 대체합니다. 실제 API 키를 사용하는 연결 검증은 별도의 수동 스모크 테스트와 전체 통합 테스트에서 최소 횟수로 수행합니다.

```text
실제 서비스 및 수동 통합 테스트
→ 실제 OpenAI API 호출

pytest 단위·자동 테스트
→ 가짜 OpenAI 응답 사용
```

추가할 테스트:

- 정상 구조화 응답
- 존재하지 않는 강의 ID
- 중복 강의 ID
- 빈 추천 목록
- 잘못된 JSON 또는 스키마
- 요청 시간 초과
- API 인증 실패
- API 사용 한도 초과
- 폴백 결과 저장
- `AI`와 `RULE_BASED_FALLBACK` source 구분

실제 API 호출은 팀 API 키와 API 플랫폼 결제를 준비한 뒤 수동 스모크 테스트로 최소 1회 실행합니다. 이후 Gateway부터 OpenAI API와 DB 저장까지 이어지는 전체 흐름에서도 실제 호출을 확인합니다.

### 우선순위 4: 전체 MSA 통합

```text
직원 로그인
→ API Gateway
→ POST /api/courses/recommendations
→ recommend-service
→ course-service 후보 조회
→ OpenAI API
→ 서버 결과 검증
→ MariaDB 저장
→ Gateway 응답
```

확인할 시나리오:

- 직원 요청 성공
- 기업 관리자 요청 거부
- 실제 `ACTIVE` 강의만 반환
- 요청 언어와 다른 강의 제외
- OpenAI 장애 시 폴백 응답
- AI와 폴백 결과 DB 저장
- Gateway 외부 경로와 응답 형식 일치
- 일반 강의 API와 추천 API의 라우팅 충돌 없음

### 우선순위 5: 문서와 체크리스트

구현, 테스트와 실제 실행을 모두 확인한 항목만 [MVP 체크리스트](./mvp-checklist.md)에 완료 표시합니다.

추천 강의 상세 화면 이동과 수강신청 화면 동작은 프론트엔드 담당자의 구현과 통합 검증이 끝난 뒤 완료 처리합니다.

---

## 8. 개발 중 검증 명령

추천 서비스:

```bash
cd recommend-service
pytest -q
python -m compileall -q .
```

Compose 구성:

```bash
cd ..
docker compose config --quiet
docker compose config --services
```

커밋 전:

```bash
git status
git diff --check
git diff
git diff --cached
```

실제 전체 서비스 실행이 어려우면 단위 테스트, 컴파일, Compose 구성 검증과 실행하지 못한 통합 테스트를 구분해서 기록합니다.

---

## 9. 권장 커밋 분리

```text
fix(recommendation): 최신 인증 클레임 계약 반영
fix(recommendation): 강의 후보 응답 구조 처리 보완
feat(recommendation): OpenAI 추천 제공자 추가
test(recommendation): OpenAI 응답과 폴백 검증 추가
docs: AI 추천 실행 환경과 검증 결과 갱신
```

하나의 커밋에는 하나의 논리적 목적만 담고 제목과 본문은 한국어로 작성합니다.

---

## 10. 현재 제한사항

- 실제 OpenAI API는 아직 연결하지 않았습니다.
- 실제 Auth Server 토큰 클레임은 실행 환경에서 확인하지 않았습니다.
- `course-service`의 최신 강의 필터·응답 구현은 담당자 확인이 필요합니다.
- Gateway를 통한 전체 추천 요청은 실제 컨테이너 환경에서 아직 검증하지 않았습니다.
- 추천 프론트엔드는 현재 김지민 브랜치에 포함하지 않습니다.
- Python 3.14에서는 현재 Pydantic 고정 버전 설치가 실패할 수 있습니다.
- 테스트에서는 Pydantic의 클래스 기반 설정 방식에 대한 폐기 예정 경고가 발생하지만 테스트 실패는 아닙니다.

이 제한사항을 해결하기 전에는 AI 추천 MVP 전체가 완료됐다고 표시하지 않습니다.
