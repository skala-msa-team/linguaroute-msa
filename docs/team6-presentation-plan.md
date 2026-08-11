# LinguaRoute 조별 발표 기획서

> 발표 흐름: 왜(Pain Point) → 무엇(AI 솔루션) → 우선순위(스프린트) → 구현(아키텍처·API) → 결과(화면)

## 발표 산출물

- 발표자용 PPTX: `output/presentation/광주3반_6조_LinguaRoute_발표자용.pptx`
- 발표자용 PDF: `output/pdf/광주3반_6조_LinguaRoute_발표자용.pdf`
- Chrome 시연 순서: [LinguaRoute 발표 시연 가이드](./demo-scenario.md)
- 자동 시연 스킬: `$linguaroute-demo`

발표자료는 14장으로 구성하며 PowerPoint 발표자 노트에 슬라이드별 설명과 저장소 근거를 포함합니다. 동작 화면은 2026-08-11 실제 Chrome에서 다시 캡처한 랜딩·직원·기업 관리자·플랫폼 관리자 화면 9장을 사용합니다.

## 1. 이해관계자 가치(Pain Point)

| 이해관계자 | Pain Point | 중요한 이유 |
| --- | --- | --- |
| 기업 관리자 | 구독·결제·좌석·초대·진도가 흩어져 교육 운영 상태를 한눈에 보기 어려움 | 운영 비용과 계약 좌석을 통제해야 함 |
| 직원 | 많은 강의 중 지금 필요한 과정을 찾고 학습 상태를 이어가기 어려움 | 탐색 시간을 줄이고 학습 몰입을 유지해야 함 |
| 플랫폼 관리자 | 기업·사용자·강의·거래 상태가 나뉘어 전체 운영 위험을 빠르게 파악하기 어려움 | 서비스 안정성과 콘텐츠 품질을 유지해야 함 |

세 문제는 다음 흐름으로 연결됩니다.

```text
기업 구독·결제 → 좌석·초대 → 직원 수강·학습 → 기업 진도 확인 → 플랫폼 운영
```

## 2. 이를 해결하기 위한 AI 솔루션

LinguaRoute는 기업의 구독과 좌석, 직원의 강의 탐색과 학습, 기업·플랫폼 운영 결과를 한 경로로 연결합니다.

AI 추천의 목표 역할:

- 직원의 언어·수준·직무·상황·목표 분석
- 적합한 강의와 추천 이유 제공
- AI 장애 시 같은 계약의 규칙 기반 대체 응답 제공

서버가 보장하는 기준:

- 실제 등록된 `ACTIVE` 강의만 반환
- 선택 언어 일치 여부 확인
- 기존 수강 강의 제외
- 최신 직원 역할·소속·상태 검증

추천 시스템의 최종 구현은 김지민 팀원이 연동할 예정입니다. 현재 저장소의 추천 코드는 API 계약·권한·내부 조회·대체 응답 골격이며 완료 기능 또는 기본 시연 범위로 표시하지 않습니다.

## 3. 스프린트 구분

강사 가이드의 `walking skeleton → 나머지 서비스 확장` 기준을 적용합니다.

| 구분 | 구현 서비스 | 구현 결과 | 현재 상태 |
| --- | --- | --- | --- |
| Sprint 1 | `course-service`, `enrollment-service`, Vue 프론트엔드 | 직원 로그인 → 강의 검색·필터 → 상세 조회 → 수강신청 → 내 수강 목록의 한 흐름 완성 | 구현·검증 완료 |
| Sprint 2 | `payment-service`, Kafka, `user-service` | 구독 결제·멱등 처리, 결제·구독 이벤트 5종 발행·소비, 기업 좌석 권한 자동 갱신과 운영 화면 연결 | 구현·검증 완료 |
| Sprint 2 | `recommend-service` | 직원 조건 기반 추천과 실제 `ACTIVE` 강의 검증 | 김지민 팀원 최종 연동 예정 |

따라서 Sprint 2 전체를 미구현 확장 기능으로 표시하지 않습니다. 결제·Kafka·권한 갱신은 현재 코드와 통합 검증으로 완료됐으며, Sprint 2에서 남은 항목은 추천 모델의 최종 연동입니다.

## 4. 아키텍처 구성도

```text
Vue 3 Frontend
       ↓ REST /api + Bearer Token
API Gateway ── OAuth2/JWT ── Auth Server
       │ Eureka에서 서비스 주소 조회
       ↓ REST /api 라우팅
user-service · course-service · enrollment-service · payment-service · recommend-service
       ↓ 공용 DB 안의 서비스별 소유 테이블
MariaDB lecture_db

payment-service ── 결제·구독 이벤트 5종 ── Kafka ── user-service 권한 갱신
```

| 구성요소 | LinguaRoute 책임 |
| --- | --- |
| Auth Server | 이메일·비밀번호 로그인, OAuth2 Authorization Code, JWT 발급 |
| API Gateway | 외부 `/api` 단일 진입점, 인증, 서비스 라우팅 |
| Eureka | 서비스 등록과 탐색 |
| `user-service` | 기업·사용자·역할·소속·초대·좌석·약관 |
| `course-service` | 강의와 차시, 검색, `ACTIVE` 상태 |
| `enrollment-service` | 수강신청, 학습 상태, 서버 진도율 계산 |
| `payment-service` | 요금제, 구독, 모의 결제, Kafka 이벤트 |
| `recommend-service` | 팀원 연동 예정인 추천 계약과 최종 강의 검증 경계 |
| Kafka | 결제·구독 상태 이벤트 전달 |
| MariaDB | 하나의 DB 안에서 서비스별 소유 테이블 분리 |

## 5. API 명세

| 화면 | Method | Gateway URL | 권한 | 응답 핵심 |
| --- | --- | --- | --- | --- |
| 기업 대시보드 | `GET` | `/api/companies/me/enrollments/progress` | 기업 관리자 | 직원별 강의·진도율 |
| 구독·결제 | `GET` | `/api/subscriptions/me`, `/api/payments` | 기업 관리자 | 구독 상태·결제 내역 |
| 강의 찾기 | `GET` | `/api/courses?language=JAPANESE` | 직원 | `ACTIVE` 강의 페이지 |
| 내 학습 | `GET` | `/api/enrollments/me` | 직원 | 수강 상태·서버 진도율 |
| 운영 대시보드 | `GET` | `/api/admin/companies`, `/api/admin/users`, `/api/admin/payments` | 플랫폼 관리자 | 서비스별 운영 목록 |
| 강의 관리 | `GET` | `/api/admin/courses?status=INACTIVE` | 플랫폼 관리자 | 비활성 강의 포함 목록 |

요청·응답 예시:

```http
GET /api/courses?language=JAPANESE
Authorization: Bearer {accessToken}
```

```json
{
  "content": [
    {
      "id": 9103,
      "title": "일본 출장 회화",
      "status": "ACTIVE"
    }
  ]
}
```

전체 외부·내부 API, 오류 코드와 권한 계약은 [API 명세](./api-spec.md)가 원본입니다.

## 6. 동작 화면 스냅샷

발표자료에는 2026-08-11 로컬 Docker Compose와 Chrome에서 다시 확인한 다음 화면을 사용합니다.

| 흐름 | 요청 전·조건 | 요청 후·결과 |
| --- | --- | --- |
| 직원 강의 탐색 | `강의 찾기`에서 일본어 필터 선택 | 실제 `ACTIVE` 일본어 강의 1개 표시 |
| 직원 학습 | 강의 탐색·수강 데이터 | `COMPLETED 100%`, `LEARNING 33.33%` 표시 |
| 기업 운영 | 소속 직원·좌석·수강 데이터 | 좌석 `3 / 50`, 평균 진도율 `44%` 표시 |
| 플랫폼 운영 | 강의 상태 필터를 `INACTIVE`로 선택 | 비활성 강의와 `활성화` 작업 표시 |

발표 중에는 결제 생성, 초대 생성, 수강 상태 변경, 강의 활성·비활성처럼 데이터를 변경하는 동작을 실행하지 않습니다. 자세한 역할별 순서와 실패 복구 절차는 [시연 가이드](./demo-scenario.md)를 따릅니다.

## 발표 슬라이드 순서

1. 표지
2. 이해관계자별 Pain Point
3. 하나로 이어지는 핵심 가치 경로
4. AI 역할과 서버 검증 경계
5. Sprint 1·2 구분
6. MSA 아키텍처 구성도
7. 프론트 API 호출 원칙
8. 핵심 엔드포인트 목록
9. 랜딩 → 직원 로그인 화면
10. 직원 일본어 강의 필터 화면
11. 직원 내 학습 화면
12. 기업 대시보드 → 구독·결제 → 직원 진도 화면
13. 플랫폼 운영 대시보드 → 비활성 강의 화면
14. 시연 전환과 추천 시스템 다음 단계
