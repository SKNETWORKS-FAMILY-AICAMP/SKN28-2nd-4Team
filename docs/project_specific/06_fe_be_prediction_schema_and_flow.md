# FE-BE Prediction Schema And Flow

## 목적

이 문서는 현재 시뮬레이터에서 아래 3가지를 한 번에 정리한다.

- 서빙 모델이 실제로 요구하는 입력 스키마
- BE business logic 이 사용하는 내부 스키마와 변환 규칙
- FE 와 BE 사이에서 실제로 주고받는 정보와 구현 위치

기준 코드는 아래 경로들이다.

- BE 모델/로직: `be/src/be/business_model.py`, `be/src/be/prediction.py`, `be/src/be/schemas.py`
- BE 시나리오 소스: `be/src/be/simulation_scenario.json`
- FE 계약/호출: `fe/src/shared/api/contracts.ts`, `fe/src/shared/api/prediction.ts`
- FE orchestration: `fe/src/features/simulator/pages/DashboardPage.tsx`, `fe/src/features/simulator/hooks/use-simulation-prediction.ts`
- FE LLM/operator: `fe/src/features/operator/hooks/use-operator-assistant.ts`, `fe/src/features/simulator/components/advisor-console.tsx`
- 서빙 모델 스키마 원본: `back_research/myungbin/Ecommerce_Customer/artifacts/model_xgb_v2_no_customer_id_schema.json`

## 1. 현재 서빙 모델

현재 BE 기본 서빙 모델은 아래 파일이다.

- 모델: `back_research/myungbin/Ecommerce_Customer/artifacts/model_xgb_v2_no_customer_id.pkl`
- 스키마: `back_research/myungbin/Ecommerce_Customer/artifacts/model_xgb_v2_no_customer_id_schema.json`

설정 위치:

- `be/src/be/settings.py`

로드 흐름:

1. `settings.py` 가 모델/스키마/데이터셋 경로를 정한다.
2. `PredictionService` 가 `CustomerChurnBusinessModel` 을 생성한다.
3. `CustomerChurnBusinessModel` 이 아래를 함께 검증한다.
   - exported `pkl`
   - exported schema json
   - dataset 컬럼 순서

즉 현재 서빙 기준의 source of truth 는 노트북 설명문이 아니라 아래 두 파일이다.

- `model_xgb_v2_no_customer_id.pkl`
- `model_xgb_v2_no_customer_id_schema.json`

## 2. 모델이 요구하는 실제 입력 스키마

모델 입력은 `EcommerceCustomerModelInput` 이다.

정의 위치:

- BE: `be/src/be/schemas.py`
- FE: `fe/src/shared/api/contracts.ts`

총 18개 컬럼이며 `CustomerID` 는 제거된 상태다.

### Numeric Features

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| `Tenure` | `float` | 고객 유지 기간 |
| `CityTier` | `int` | 지역 tier |
| `WarehouseToHome` | `float` | 배송 체감 거리/시간 관련 지표 |
| `HourSpendOnApp` | `float` | 앱 체류 시간 |
| `NumberOfDeviceRegistered` | `int` | 등록 디바이스 수 |
| `SatisfactionScore` | `int` | 만족도 점수 |
| `NumberOfAddress` | `int` | 등록 주소 수 |
| `Complain` | `int` | 불만 여부/수치 |
| `OrderAmountHikeFromlastYear` | `float` | 전년 대비 주문금액 변화 |
| `CouponUsed` | `float` | 쿠폰 사용량 |
| `OrderCount` | `float` | 주문 수 |
| `DaySinceLastOrder` | `float` | 마지막 주문 이후 경과일 |
| `CashbackAmount` | `float` | 캐시백 금액 |

### Categorical Features

| 필드 | 타입 | 허용값 |
| --- | --- | --- |
| `PreferredLoginDevice` | `string` | `Computer`, `Mobile` |
| `PreferredPaymentMode` | `string` | `Cash on Delivery`, `Credit Card`, `Debit Card`, `E wallet`, `UPI` |
| `Gender` | `string` | `Female`, `Male` |
| `PreferedOrderCat` | `string` | `Fashion`, `Grocery`, `Laptop & Accessory`, `Mobile`, `Others` |
| `MaritalStatus` | `string` | `Divorced`, `Married`, `Single` |

## 3. BE Business Logic 스키마

### 3.1 PredictionState

정의:

- BE: `be/src/be/schemas.py`

구조:

```json
{
  "system_id": "growth | trust | platform | support",
  "turn_index": 1,
  "current_users": 13661,
  "model_input": {
    "Tenure": 9.0,
    "PreferredLoginDevice": "Mobile",
    "CityTier": 1,
    "WarehouseToHome": 13.0,
    "PreferredPaymentMode": "UPI",
    "Gender": "Male",
    "HourSpendOnApp": 3.0,
    "NumberOfDeviceRegistered": 4,
    "PreferedOrderCat": "Mobile",
    "SatisfactionScore": 4,
    "MaritalStatus": "Single",
    "NumberOfAddress": 2,
    "Complain": 0,
    "OrderAmountHikeFromlastYear": 13.0,
    "CouponUsed": 2.0,
    "OrderCount": 4.0,
    "DaySinceLastOrder": 3.0,
    "CashbackAmount": 180.0
  }
}
```

설명:

- `system_id`: 현재 어떤 운영 시스템 맥락에서 플레이 중인지 나타냄
- `turn_index`: 현재 턴 번호
- `current_users`: 현재 게임 상 사용자 수
- `model_input`: 실제 churn 모델에 들어가는 customer-level feature row

### 3.2 PredictionDecision

정의:

- BE: `be/src/be/schemas.py`

구조:

```json
{
  "action_id": "hold | coupon_push | service_recovery | experience_refresh | vip_protection | ops_stabilize",
  "intensity": 0.0 ~ 1.0
}
```

설명:

- `action_id`: 어떤 business directive 를 선택했는지
- `intensity`: 해당 directive 를 얼마나 강하게 적용할지

### 3.3 SimulationEvent

정의:

- BE: `be/src/be/schemas.py`
- 데이터 소스: `be/src/be/simulation_scenario.json`

구조:

- `event_id`
- `system_id`
- `label`
- `summary`
- `severity`
- `weight`
- `state_effects`
- `feature_multipliers`
- `feature_additions`
- `loss_rate_bias`

현재 코드에서 실제로 모델 입력에 반영되는 건 아래 3개다.

- `feature_multipliers`
- `feature_additions`
- `loss_rate_bias`

`state_effects` 는 현재 서빙 로직에서 사용되지 않는다.

## 4. 회사 정책에서 고객 feature 로 내려가는 변환

핵심 위치:

- `be/src/be/business_model.py`

현재 구조는 다음과 같다.

1. 게임에서 사용자가 선택하는 것은 company-level policy / directive 이다.
2. 학습 모델은 customer-level feature row 를 입력으로 받는다.
3. `CustomerChurnBusinessModel.build_model_input()` 이 중간 번역 계층이다.
4. 이 함수가 현재 `PredictionState.model_input` 을 기준으로 아래를 적용한다.
   - directive effect
   - random event effect
5. 최종 결과를 새 `EcommerceCustomerModelInput` 으로 정규화한다.

즉 현재 business model 의 역할은 아래 한 줄로 요약된다.

> 회사 정책 선택을 고객 단위 18개 feature 변화로 번역하는 계층

### 현재 directive -> feature 연결

정의 위치:

- `be/src/be/business_model.py:101-170`

| action_id | 바꾸는 feature | 방식 |
| --- | --- | --- |
| `hold` | 없음 | 그대로 유지 |
| `coupon_push` | `CouponUsed`, `CashbackAmount`, `SatisfactionScore` | 쿠폰/캐시백 증폭 + 만족도 소폭 증가 |
| `service_recovery` | `Complain`, `WarehouseToHome`, `SatisfactionScore`, `HourSpendOnApp` | 불만/배송 체감 완화 + 만족도/체류 증가 |
| `experience_refresh` | `HourSpendOnApp`, `OrderCount`, `DaySinceLastOrder`, `CashbackAmount` | engagement/order 증가 + recency 감소 |
| `vip_protection` | `NumberOfAddress`, `NumberOfDeviceRegistered`, `CashbackAmount`, `SatisfactionScore` | 충성 고객 방어형 강화 |
| `ops_stabilize` | `WarehouseToHome`, `Complain`, `SatisfactionScore` | 운영 안정화형 완화 |

중요:

- 현재는 이 매핑이 `dict[str, float]` 로 들어가 있어 stringly-typed 상태다.
- 즉 `action_id`, feature name, category value 가 중앙 enum 으로 아직 정리되지 않았다.
- 다음 리팩토링 대상은 이 부분이다.

## 5. FE <-> BE 사이에 실제로 주고받는 정보

### 5.1 대시보드 초기 데이터

엔드포인트:

- `GET /api/simulator/dashboard`

BE:

- 라우팅: `be/src/be/app.py:79-81`
- 소스: `be/src/be/simulation_scenario.json`

FE:

- API 함수: `fe/src/features/simulator/api.ts`
- 호출 hook: `fe/src/features/simulator/hooks/use-simulator-data.ts`
- 최종 조합: `fe/src/features/simulator/pages/DashboardPage.tsx`

주요 필드:

- `workspace`
- `systems`
- `incidents`
- `initialPolicies`
- `initialMessages`
- `focusBySystem`
- `trendBySystem`

### 5.2 세션 시작

엔드포인트:

- `POST /api/prediction/session/start`

요청 스키마:

```json
{
  "system_id": "growth",
  "initial_users": 13661,
  "random_seed": 7
}
```

응답 스키마:

```json
{
  "session_id": "...",
  "random_seed": 7,
  "business_model_id": "ecommerce_customer_xgb_v2_no_customer_id",
  "state": { "PredictionState" },
  "available_actions": [{ "action_id": "...", "label": "...", "summary": "..." }],
  "model_schema": [{ "name": "Tenure", "dtype": "numeric", "categories": [] }],
  "initial_trend_point": { "label": "Month 1", "actual_users": 13661, "predicted_users": 13661, "churn_risk": 0.0 }
}
```

FE 구현 위치:

- API 함수: `fe/src/shared/api/prediction.ts`
- 호출: `fe/src/features/simulator/hooks/use-simulation-prediction.ts:44-60`
- 저장: `fe/src/stores/simulation-ui-store.ts`

현재 주의점:

- BE 는 `available_actions` 와 `model_schema` 를 같이 내려주지만, FE 는 현재 이를 store 에 저장하지 않는다.
- 즉 실제 엔진이 허용하는 공식 action 목록은 응답에 존재하지만 현재 UI 와 operator agent 에서는 직접 사용하지 않는다.

### 5.3 턴 진행 / 예측 실행

엔드포인트:

- `POST /api/prediction/churn`

요청 스키마:

```json
{
  "session_id": "...",
  "state": { "PredictionState" },
  "decision": {
    "action_id": "experience_refresh",
    "intensity": 0.65
  }
}
```

현재 실제 FE payload 특징:

- `decision.action_id` 는 `policy.decision.actionId` 에서 그대로 옴
- `decision.intensity` 도 `policy.decision.intensity` 를 그대로 relay 함
- `incident_id` 필드는 스키마에는 있지만 현재 FE 에서 채우지 않음

응답 스키마:

```json
{
  "session_id": "...",
  "engine_id": "live_customer_churn_inference_xgb_v2",
  "business_model_id": "ecommerce_customer_xgb_v2_no_customer_id",
  "churn_probability": 0.18,
  "effective_loss_rate": 0.04,
  "retention_probability": 0.82,
  "risk_band": "low | medium | high",
  "drivers": ["..."],
  "event": { "SimulationEvent" },
  "expected_lost_users": 530,
  "predicted_users_next": 13131,
  "next_state": { "PredictionState" },
  "trend_point": { "label": "Month 2", "actual_users": 13661, "predicted_users": 13131, "churn_risk": 4.0 }
}
```

FE 구현 위치:

- API 함수: `fe/src/shared/api/prediction.ts`
- 요청 생성: `fe/src/features/simulator/hooks/use-simulation-prediction.ts:76-100`
- 정책 선택 -> decision 변환: `fe/src/features/simulator/pages/DashboardPage.tsx:141-150`

## 6. FE 쪽에서 정책 결정이 만들어지는 위치

### 6.1 유저가 누르는 곳

- 컴포넌트: `fe/src/features/simulator/components/policy-board.tsx`
- 버튼: `Arm Directive`

### 6.2 실제 decision 으로 변환되는 곳

- `fe/src/features/simulator/pages/DashboardPage.tsx:141-150`

현재 로직:

1. 사용자가 `policy.id` 를 선택한다.
2. `workspaceModel.policies` 에서 해당 policy 를 찾는다.
3. 아래 값을 꺼낸다.
   - `policy.decision.actionId`
   - `policy.decision.intensity`
4. FE 가 `PredictionDecision` 으로 바꿔 BE 에 보낸다.

즉 현재는 `policy -> decision` 매핑이 시나리오 JSON 안에 들어 있고, FE 는 그 값을 그대로 relay 한다.

또한 현재 사용자는 자유롭게 action 을 조합해서 보내지 못한다.

- 가능한 실행 액션은 우측 `PolicyBoard` 에 노출된 preset policy 선택뿐이다.
- operator console 의 텍스트 입력은 LLM 조언용이며, BE prediction 요청을 직접 만들지 않는다.

## 6.3 incident 와 실제 BE event 의 불일치 가능성

현재 BE 는 `PredictionDecision.incident_id` 가 들어오면 그 incident 가 가리키는 event 를 고정 사용하고, 없으면 `system_id` 기준으로 랜덤 event 를 샘플링한다.

하지만 현재 FE 는 `incident_id` 를 보내지 않는다.

즉 실제 런타임은 다음과 같다.

1. FE 는 화면에서 특정 incident 를 보여준다.
2. 사용자는 그 맥락에서 policy 를 고른다.
3. FE 는 `action_id`, `intensity` 만 BE 에 보낸다.
4. BE 는 같은 system 내 event 중 하나를 랜덤 선택해 예측한다.

따라서 현재 UI 에서 강조 중인 incident 와, BE 가 실제 계산에 사용한 event 가 항상 일치하지는 않는다.

추가로 `selectedIncidentId` 상태는 store 와 page 에 존재하지만, 현재 읽은 범위에서는 이를 실제로 바꾸는 UI 연결이 보이지 않는다.

즉 현재 incident 맥락은 시스템별 첫 incident 에 사실상 고정될 가능성이 높다.

## 7. FE 쪽 operator LLM 에서 state/context 를 읽는 위치

위치:

- `fe/src/features/operator/hooks/use-operator-assistant.ts`

현재 operator flow:

1. 사용자가 `AdvisorConsole` 에서 프롬프트 입력
2. `DashboardPage.handleSubmitOperatorRequest()` 가 아래 컨텍스트를 수집
   - `monthlyLabel`
   - `selectedSystem.name`
   - `predictionState`
   - `highlightedIncident`
   - `armedPolicies`
   - `latestTrend`
3. `useOperatorAssistant` 가 OpenRouter + AI SDK `streamText()` 호출
4. tool 호출로 아래를 읽는다.
   - `get_current_state`
   - `get_priority_incident`
   - `get_active_directives`
   - `get_latest_trend`
5. `readUIMessageStream()` 로 스트리밍 파트를 읽어서 `Synthesis Log` 에 표시한다.

즉 operator LLM 은 현재 FE 가 들고 있는 prediction state 를 tool 로 조회하는 구조다.

## 8. 현재 구조에서 바로 보이는 문제점

### 8.1 action_id 와 feature name 이 중앙 enum 으로 정리되지 않음

현재 문제:

- `SimulationAction.action_id` 는 아직 plain string
- `PredictionDecision.action_id` 도 plain string
- business model 내부 feature 조작도 `dict[str, float]`

영향:

- directive 와 실제 모델 feature 연결이 type level 에서 보장되지 않음
- 오타가 나도 runtime 까지 가야 잡힘

### 8.2 scenario 와 business model effect 가 분리돼 있음

현재:

- 시나리오 파일에는 `policy.decision` 만 있음
- 실제 feature 조작은 `business_model.py` 안에 하드코딩

즉:

- 어떤 policy 가 어떤 모델 입력을 바꾸는지 한 파일에서 안 보임
- 시나리오 authoring 과 모델 input authoring 이 분리되어 있음

### 8.3 event schema 에 dead field 가 남아 있음

`SimulationEvent.state_effects` 는 현재 customer-level serving flow에서 사용되지 않는다.

## 9. 다음 리팩토링 권장 순서

1. `action_id` 를 enum 으로 승격
2. 18개 model feature name 도 enum 또는 상수 집합으로 승격
3. `feature_multipliers` / `feature_additions` 를 typed adjustment list 로 변경
4. 시나리오 파일에서도 policy 별 `affected_features` 를 명시
5. FE 에서도 `PredictionDecision.action_id` 를 string 대신 union/enum 으로 고정

이 순서로 가면 아래 질문에 답하기 쉬워진다.

- 이 policy 는 모델 입력의 무엇을 바꾸는가?
- 이 incident 는 어떤 지표를 흔드는가?
- FE 가 보내는 현재 state 와 directive 가 실제로 어떤 feature row 로 번역되는가?

## 10. 한 줄 요약

- 모델이 실제로 요구하는 스키마는 `EcommerceCustomerModelInput` 18개 컬럼이다.
- FE 와 BE 가 주고받는 핵심 계약은 `PredictionState`, `PredictionDecision`, `PredictionResponse` 다.
- 현재 business logic 은 company-level directive 를 customer-level 18개 feature 변화로 번역한다.
- 다만 directive/action/feature 연결은 아직 string 기반이라, 다음 리팩토링에서 enum + typed adjustment 구조로 정리하는 것이 맞다.
