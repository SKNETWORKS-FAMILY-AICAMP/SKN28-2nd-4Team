# Operator Agent Prompt And Tools

## 0. 문서 목적

본 문서는 `fe/src/features/operator/hooks/use-operator-assistant.ts` 기준으로,

- 운영자 AI agent 에게 실제로 어떤 system prompt 가 전달되는지
- 어떤 데이터가 agent 에게 직접 주입되는지
- 어떤 tool 이 주어지는지
- 각 tool 이 실제로 어떤 데이터를 반환하는지

를 정리한다.

이 문서는 추상 설계가 아니라 현재 프런트엔드 구현의 런타임 기준 문서다.

## 1. 실제 프롬프트 구성

운영자 AI 호출은 `submitRequest(request, context)` 에서 `streamText(...)` 로 수행된다.

### 1.1 System Prompt

system prompt 는 아래 2개 레이어가 합쳐져 전달된다.

1. 환경변수 기반 기본 system prompt
2. 훅 내부에서 강제하는 실행 지시문

현재 기본값은 `fe/src/shared/config/env.ts` 에 정의되어 있다.

```text
You are the strategy operator for a retention simulator. Keep answers concise, action-oriented, and tied to the current incident, active policies, and projected user loss. Explain concrete operational actions that cause the recommended stat changes, not just the stat changes themselves.
```

실제 런타임에서 최종 system prompt 는 아래처럼 합쳐진다.

```text
{VITE_LLM_SYSTEM_PROMPT 또는 기본값}
반드시 한국어로만 답변해.
답변을 시작하기 전에 tools를 사용해 현재 시뮬레이션 상태를 확인해.
절대로 "만족도를 올리세요" 같이 스탯 이름만 말하고 끝내지 마.
각 권장안은 반드시 "운영 행동 -> 기대 스탯 변화 -> churn 방어 이유" 흐름으로 설명해.
도구 결과를 근거로 1) 상황 요약 2) 권장 조치 3) 주의할 리스크 순서로 짧고 명확하게 답해.
```

즉, 현재 구현의 핵심 제약은 다음과 같다.

- 답변 언어는 한국어 고정
- 답변 전에 tool 사용이 사실상 강제됨
- 답변 포맷은 `상황 요약 -> 권장 조치 -> 주의할 리스크`
- 답변은 짧고 실행 지향적으로 요구됨
- 단순 스탯 조정 지시가 아니라 실제 운영 행동을 먼저 설명하도록 강제됨

### 1.2 User Prompt

user prompt 역시 훅 내부에서 고정 템플릿으로 합성된다.

```text
운영자 요청을 처리해.
답변 전에 반드시 도구를 사용해서 현재 상태를 확인해.
최소한 현재 상태, 우선 인시던트, 활성 디렉티브를 확인한 뒤 답해.

운영자 요청: {사용자 입력}
```

즉, user prompt 레벨에서도 최소 3개 tool 조회가 유도된다.

- `get_current_state`
- `get_priority_incident`
- `get_active_directives`

## 2. Agent 에게 주는 데이터

AI agent 에게는 자유 텍스트만 주는 것이 아니라, `context` 객체가 함께 들어가고 이 값들이 tool 결과의 원천이 된다.

타입은 `AssistantPromptContext` 이다.

```ts
type AssistantPromptContext = {
  monthlyLabel: string
  systemName: string
  currentState: PredictionState
  incident: {
    title: string
    summary: string
    impact: string
    request: string
  }
  armedPolicies: Array<{
    title: string
    effect: string
  }>
  latestTrend?: {
    actualUsers: number | null
    predictedUsers: number
    churnRisk: number
  }
}
```

### 2.1 실제 주입 데이터 출처

이 값들은 `fe/src/features/simulator/pages/DashboardPage.tsx` 에서 만들어져 `submitRequest(...)` 로 전달된다.

현재 agent 가 간접적으로 참조 가능한 데이터는 다음이다.

1. `monthlyLabel`
   현재 월/턴 라벨

2. `systemName`
   현재 선택된 시스템 이름

3. `currentState`
   현재 예측 상태
   포함 필드:
   - `system_id`
   - `turn_index`
   - `current_users`
   - `model_input` 전체 피처

4. `incident`
   현재 우선 인시던트 핵심 요약
   포함 필드:
   - `title`
   - `summary`
   - `impact`
   - `request`

5. `armedPolicies`
   현재 Armed 상태 정책 목록
   각 항목 포함 필드:
   - `title`
   - `effect`

6. `latestTrend`
   최신 추세 한 점
   포함 필드:
   - `actualUsers`
   - `predictedUsers`
   - `churnRisk`

### 2.2 현재 agent 에게 주지 않는 데이터

현재 구현상 agent 는 아래 데이터를 직접 받지 않는다.

- 전체 incident 목록
- 전체 trend 시계열 전체
- policy 의 owner, source, decision 세부값
- BE 가 세션 시작 시 내려주는 `available_actions`
- backend architecture 정보
- 과거 대화 외의 별도 장기 메모리

즉, agent 는 현재 선택된 시스템의 "지금 상태를 빠르게 판단하는 보조자" 역할에 맞춰 최소 컨텍스트만 받는다.

중요하게, 현재 FE 는 `POST /api/prediction/session/start` 응답에 포함된 `available_actions` 를 저장하지도 않고 agent 에게 전달하지도 않는다.

즉 현재 operator agent 는 아래를 모른다.

- 지금 엔진이 허용하는 공식 action 목록
- 각 action 의 label / summary
- 사용자가 실제로 지금 누를 수 있는 전략 선택지 전체

이 점 때문에 system prompt 에서 action 선택을 강하게 유도하는 문장은 현재 구현과 어긋날 수 있다.

## 3. 사용자가 실제로 취하는 액션

현재 UI 기준으로 사용자가 실제로 취하는 액션은 크게 2종류다.

### 3.1 Operator 요청 전송

- 위치: `AdvisorConsole`
- 동작: 텍스트 요청을 LLM 에 보냄
- BE 호출: 없음
- 결과: agent 가 FE 로컬 tool 을 읽고 조언 텍스트를 생성

즉 이 액션은 전략 제안/설명용이고, 시뮬레이션 상태를 직접 바꾸지 않는다.

### 3.2 Strategy 선택

- 위치: `PolicyBoard` 의 `Select Strategy` 버튼
- 동작: 특정 preset policy 를 Armed 처리하고 해당 policy 의 `decision` 을 BE 예측 요청으로 보냄
- BE 호출: 있음
- 결과: 다음 턴 예측 상태가 갱신됨

현재 코드에서 사용자가 실제로 BE 에 보내는 action 은 자유 입력이 아니라, 시나리오 JSON 에 미리 정의된 `policy.decision` 값이다.

즉 현재 구조는 아래다.

```text
사용자 클릭
-> policy 선택
-> policy.decision.actionId / intensity 추출
-> PredictionDecision 생성
-> POST /api/prediction/churn
-> BE 가 next_state / trend_point 반환
-> FE store 갱신
```

## 4. FE -> BE 액션 전달 로직

### 4.1 세션 시작

FE 는 페이지 진입 후 `useSimulationPrediction` 안에서 먼저 세션을 시작한다.

요청:

```json
{
  "system_id": "growth",
  "initial_users": 13661
}
```

엔드포인트:

- `POST /api/prediction/session/start`

BE 응답에는 아래가 포함된다.

- `session_id`
- `state`
- `available_actions`
- `model_schema`
- `initial_trend_point`

하지만 현재 FE 는 여기서 실질적으로 아래만 저장한다.

- `session_id`
- `state`
- `initial_trend_point`

즉 `available_actions` 와 `model_schema` 는 현재 UI/agent 에서 활용되지 않는다.

### 4.2 턴 진행

사용자가 우측 전략 패널에서 policy 를 선택하면 `DashboardPage.handleArmPolicy()` 가 실행된다.

현재 생성되는 decision 은 아래 형태다.

```json
{
  "action_id": "experience_refresh",
  "intensity": 0.65
}
```

그리고 FE 가 BE 로 보내는 최종 payload 는 아래 구조다.

```json
{
  "session_id": "...",
  "state": {
    "system_id": "growth",
    "turn_index": 1,
    "current_users": 13661,
    "model_input": {}
  },
  "decision": {
    "action_id": "experience_refresh",
    "intensity": 0.65
  }
}
```

엔드포인트:

- `POST /api/prediction/churn`

### 4.3 현재 incident 와 BE 이벤트의 관계

여기가 현재 가장 중요한 포인트다.

`PredictionDecision` 스키마에는 `incident_id` 가 존재하지만, FE 의 `handleArmPolicy()` 는 지금 `incident_id` 를 채우지 않는다.

즉 현재 BE 는 대부분 아래 방식으로 동작한다.

1. FE 가 `system_id`, `state`, `action_id`, `intensity` 를 보냄
2. FE 는 `incident_id` 를 보내지 않음
3. BE 는 `system_id` 기준으로 가능한 event 들 중 하나를 랜덤 샘플링함
4. 그 event effect 와 action effect 를 합쳐 다음 턴을 계산함

즉 UI 에서 보고 있는 highlighted incident 와, BE 가 실제 예측에 사용한 event 가 항상 일치하는 구조가 아니다.

추가로 현재 FE 코드상 `selectedIncidentId` 상태는 존재하지만, 실제 화면에서 이를 바꾸는 연결은 아직 보이지 않는다.

즉 현재 highlighted incident 는 대부분 "선택 시스템의 첫 incident" 로 고정될 가능성이 높다.

## 5. 실제 제공 Tool 목록

현재 `useOperatorAssistant` 에서 agent 에게 주는 tool 은 총 4개다.

모두 프런트 메모리의 로컬 상태를 읽는 read-only tool 이고, 외부 API 를 호출하지 않는다.

## 5.1 Tool 상세

### 5.1 `get_current_state`

- 설명: 현재 FE 가 유지 중인 시뮬레이션 상태 조회
- 입력: 없음 (`{}`)
- 반환값:

```json
{
  "month": "2026-04",
  "system": "Growth Core",
  "state": {
    "system_id": "growth",
    "turn_index": 3,
    "current_users": 120000,
    "model_input": {
      "Tenure": 12,
      "PreferredLoginDevice": "Mobile Phone"
    }
  }
}
```

- 역할:
  현재 몇 번째 턴인지, 어떤 시스템인지, 현재 사용자 수와 모델 입력 특성이 어떤지 확인한다.
- agent 활용 포인트:
  현재 상황의 기준점 확인용이다. 거의 모든 답변 전에 호출해야 한다.

### 5.2 `get_priority_incident`

- 설명: 현재 선택된 우선 인시던트 상세 조회
- 입력: 없음 (`{}`)
- 반환값:

```json
{
  "incident": {
    "title": "결제 장애 확산",
    "summary": "일부 구간에서 결제 실패율이 급증했다.",
    "impact": "신규 결제 전환과 재구매에 직접 타격",
    "request": "긴급 완화 조치와 사용자 안내 정책을 제안해줘"
  }
}
```

- 역할:
  현재 운영자가 가장 우선으로 봐야 할 사건의 맥락을 제공한다.
- agent 활용 포인트:
  답변이 일반론으로 흐르지 않게 하고, 조치 우선순위를 인시던트 중심으로 고정한다.

### 5.3 `get_active_directives`

- 설명: Armed 상태 디렉티브 목록 조회
- 입력: 없음 (`{}`)
- 반환값:

```json
{
  "armed_directives": [
    {
      "title": "VIP 보상 배너 노출",
      "effect": "고위험 세그먼트 이탈 억제"
    },
    {
      "title": "장애 공지 강화",
      "effect": "신뢰 하락 완충"
    }
  ]
}
```

- 역할:
  이미 발동 중인 정책이 무엇인지 알려준다.
- agent 활용 포인트:
  중복 제안을 피하고, 기존 정책 보완/강화/해제 판단 근거를 만든다.

### 5.4 `get_latest_trend`

- 설명: 최신 사용자 수 및 이탈 위험 추세 조회
- 입력: 없음 (`{}`)
- 반환값:

```json
{
  "latest_trend": {
    "actualUsers": 118400,
    "predictedUsers": 116900,
    "churnRisk": 0.27
  }
}
```

또는 추세가 없으면 아래처럼 반환된다.

```json
{
  "latest_trend": null
}
```

- 역할:
  가장 최근 손실 추세와 리스크 수치를 제공한다.
- agent 활용 포인트:
  조치의 긴급도를 정하는 마지막 수치 근거로 쓰기 좋다.

## 6. Tool 사용 방식 해석

현재 구조에서 tool 은 "행동 실행" 도구가 아니라 "판단 근거 조회" 도구다.

즉 agent 는 다음을 할 수 없다.

- 정책을 직접 arm 하기
- incident 선택을 바꾸기
- backend 에 새 예측 요청 보내기
- 사용자 데이터를 수정하기

대신 아래만 할 수 있다.

- 현재 상태 읽기
- 현재 인시던트 읽기
- 현재 활성 정책 읽기
- 최신 추세 읽기
- 그 근거로 운영자 답변 작성하기

따라서 이 agent 는 실행기(executor)보다는 분석형 조언자(advisor)에 가깝다.

## 7. 현재 구현 기준 권장 System Prompt 정리본

현재 코드 의도를 문서형으로 다시 쓰면 아래와 같다.

```text
너는 retention simulator 의 strategy operator 다.
항상 한국어로만 답변한다.
답변 전에 반드시 tool 로 현재 시뮬레이션 상태를 확인한다.
최소한 현재 상태, 우선 인시던트, 활성 디렉티브를 확인한 뒤 답변한다.
가능하면 최신 trend 도 확인해서 근거를 보강한다.
현재 사용자가 실제로 실행할 수 있는 전략은 UI 에 노출된 preset policy 선택뿐이라고 가정한다.
엔진의 공식 action 목록은 현재 직접 주어지지 않으므로, tool 에 없는 action 을 새로 단정하지 않는다.
정책 제안 시에는 가능한 경우 현재 Armed/Draft/Queued 정책과 연결해 설명한다.
답변은 반드시 도구 결과를 근거로 작성하고,
1) 상황 요약
2) 권장 조치
3) 주의할 리스크
순서로 짧고 명확하게 정리한다.
이미 활성화된 디렉티브와 중복되는 제안은 피하고,
현재 incident 의 영향과 예상 사용자 손실을 기준으로 우선순위를 판단한다.
```

## 8. 실제 런타임 흐름 요약

1. 운영자가 요청 문장을 입력한다.
2. `DashboardPage` 가 현재 선택 시스템 기준 context 를 조립한다.
3. `useOperatorAssistant.submitRequest()` 가 system prompt 와 user prompt 를 합성한다.
4. `streamText()` 가 OpenRouter 모델을 호출한다.
5. agent 는 필요시 4개 tool 을 호출해 현재 상태를 읽는다.
6. tool 결과를 근거로 한국어 답변을 생성한다.
7. 프런트는 text part 와 tool part 를 `OperatorMessage` 로 변환해 UI 에 표시한다.

별도로, 사용자가 전략 버튼을 누르면 아래 흐름이 돈다.

1. 사용자가 preset policy 하나를 선택한다.
2. FE 가 해당 policy 의 `decision.actionId`, `decision.intensity` 를 읽는다.
3. FE 가 `session_id + state + decision` 을 BE 로 전송한다.
4. BE 가 event 를 샘플링하고 action effect 를 반영해 `next_state` 를 계산한다.
5. FE 는 `predictionState` 와 `liveTrend` 를 갱신한다.

## 9. 구현 파일 기준 레퍼런스

- tool / prompt 조합: `fe/src/features/operator/hooks/use-operator-assistant.ts`
- strategy 선택 -> BE 요청 생성: `fe/src/features/simulator/pages/DashboardPage.tsx`
- 세션 시작 / 턴 실행: `fe/src/features/simulator/hooks/use-simulation-prediction.ts`
- 정책 선택 UI: `fe/src/features/simulator/components/policy-board.tsx`
- env 기본 system prompt: `fe/src/shared/config/env.ts`
- agent context 조립: `fe/src/features/simulator/pages/DashboardPage.tsx`
- 상태 타입: `fe/src/shared/api/contracts.ts`
- operator message 타입: `fe/src/features/simulator/contracts.ts`
- BE 라우팅: `be/src/be/app.py`
- BE 세션/스코어 로직: `be/src/be/prediction.py`
- action -> feature 변환: `be/src/be/business_model.py`
