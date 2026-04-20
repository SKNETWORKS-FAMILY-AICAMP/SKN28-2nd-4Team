# Strategy Options Form And Strict Model Input Schema

## 0. 문서 목적

본 문서는 현재 `strategy options` 영역을 `preset policy 선택` 중심 구조에서 `사용자 전략 form 입력` 중심 구조로 바꾸기 위한 이론 문서다.

핵심 전환은 아래 한 줄로 요약된다.

`player selection form -> strict raw model input -> model 직접 입력`

이 문서는 아래 4가지를 정의한다.

1. 현재 구조가 왜 문제인지
2. strategy options UI 가 어떤 레이어를 가져야 하는지
3. 모델 직전 입력의 strict schema 가 무엇인지
4. 어떤 필드를 전략 레버로 보여주고 어떤 필드를 맥락 값으로 다뤄야 하는지

본 문서는 이론 문서이며, 구현 코드나 API 코드 예시는 포함하지 않는다.

## 1. 현재 구조의 문제

현재 FE-BE scoring 흐름은 사용자의 선택이 곧바로 모델 입력으로 가지 않고, 중간에 `decision` 과 내부 mapper 를 거친다.

이 구조의 문제는 다음과 같다.

1. 사용자가 실제로 무엇을 바꾸는지 UI 에서 명확하지 않다.
2. 모델이 실제로 어떤 입력을 받는지 FE 계약에서 바로 보이지 않는다.
3. `action_id` 와 내부 feature perturbation 규칙이 분리되어 있어 설명 가능성이 낮다.
4. strategy options 가 실제 입력 레버가 아니라 간접 정책 이름 목록으로 보이게 된다.
5. preset policy 가 늘어날수록 모델 입력 계약은 더 숨겨지고, 폼 설계 자유도는 줄어든다.

즉 strategy options 영역이 진짜로 보여줘야 하는 것은 `정책 이름` 이 아니라 `사용자가 어떤 상태값을 어떤 방향으로 조절하려는가` 다.

## 2. Source Of Truth

strict schema 의 근거는 아래 4개다.

- 서빙 feature schema: `back_research/myungbin/Ecommerce_Customer/artifacts/model_xgb_v2_no_customer_id_schema.json`
- 학습 데이터: `back_research/myungbin/Ecommerce_Customer/datasets/churn_preprocessed.csv`
- 범주값 정규화 근거: `back_research/myungbin/Ecommerce_Customer/notebooks/preprocessing.ipynb`
- 서빙 feature 정합성 근거: `back_research/myungbin/Ecommerce_Customer/notebooks/modeling_3_serving_refactor.ipynb`

현재 확인된 사실은 아래와 같다.

1. exported model 은 raw feature 18개를 직접 입력으로 받는다.
2. 모델의 `feature_names_in_` 는 exported schema 와 일치한다.
3. categorical 값은 전처리 단계에서 이미 정규화되어 있다.
4. runtime 에서는 결측치 보정보다 strict reject 가 맞다.

따라서 V1 strict schema 는 `전처리 완료 CSV 기준 observed support` 를 벗어나지 않는 범위에서 정의하는 것이 맞다.

## 3. Canonical Layer 구조

strategy options 를 다시 설계할 때는 아래 3개 레이어를 분리해야 한다.

### 3.1 Player Strategy Form Layer

이 레이어는 사용자가 전략적으로 무엇을 조정하려는지 표현하는 UX 레이어다.

이 레이어의 책임은 다음과 같다.

- 사용자가 조정 가능한 레버를 이해 가능한 언어로 보여준다.
- 증가, 감소, 유지, 선택 같은 상호작용을 제공한다.
- 전략적 의미가 낮은 필드는 기본적으로 숨기거나 고급 설정으로 보낸다.

중요한 점은, 이 레이어가 모델 필드명을 그대로 노출할 수도 있지만 반드시 그럴 필요는 없다는 것이다.

### 3.2 Translation Layer

이 레이어는 UX 상태를 `strict raw model input` 으로 변환하는 해석 레이어다.

이 레이어의 책임은 다음과 같다.

- 사용자 form 상태를 canonical 입력 필드로 정렬한다.
- enum, integer, float, binary 제약을 검증한다.
- range 밖 값, unknown enum, 빈 값을 reject 한다.

중요한 점은, 이 레이어가 business decision mapper 처럼 숨겨진 추론을 수행하면 안 된다는 것이다.

이 레이어는 `정책 이름 -> feature perturbation` 을 하는 곳이 아니라, `사용자 입력 -> 정확한 raw input` 을 만드는 곳이어야 한다.

### 3.3 Raw Model Input Layer

이 레이어는 모델이 실제로 받는 최종 canonical contract 이다.

이 레이어의 특징은 다음과 같다.

- 모든 필드는 required 다.
- categorical 은 closed enum 이다.
- numeric 은 bounded range 를 가진다.
- binary 는 `0` 또는 `1` 만 허용한다.

최종 scoring 계약은 이 레이어를 기준으로 정의해야 한다.

## 4. Strict Schema 설계 원칙

strict schema 는 아래 원칙을 따라야 한다.

1. categorical 필드는 open text 가 아니라 exact enum 이어야 한다.
2. ordinal numeric 필드는 float 가 아니라 bounded integer 로 다뤄야 한다.
3. binary signal 은 boolean 처럼 보이더라도 계약상 `0/1` 을 갖는 discrete 값으로 고정한다.
4. 모든 필드는 required 다.
5. 빈 문자열, null, undefined, unknown category 는 모두 invalid 다.
6. range 밖 numeric 값은 조용히 clamp 하지 말고 reject 해야 한다.
7. FE 와 BE 모두 동일한 strict 제약을 공유해야 한다.

추가로 중요한 운영 원칙은 아래와 같다.

- 현재 데이터 분포 안에서만 다루는 기본 모드를 기본값으로 둔다.
- 학습 support 밖 값을 다루는 실험 모드는 별도 sandbox 로 분리한다.

## 5. Raw Model Input Strict Schema

아래 표는 현재 서빙 모델이 직접 받는 18개 컬럼의 strict schema 를 정리한 것이다.

| Raw Field | 데이터 성격 | Strict Domain | 데이터 근거 | 전략 노출 권장도 | 해석 메모 |
| --- | --- | --- | --- | --- | --- |
| `Tenure` | numeric | 정수 `0..61` | CSV observed range | 낮음 | 고객 유지 기간. 단기 전략 레버보다는 코호트 맥락 값에 가깝다. |
| `PreferredLoginDevice` | categorical | `Computer`, `Mobile` | 전처리 후 정규화 | 낮음 | 사용자 접속 성향. 전략 선택보다는 코호트 프로필 값에 가깝다. |
| `CityTier` | ordinal numeric | 정수 `1..3` | CSV observed range | 낮음 | 지역 tier. 단기 운영 전략 레버로 보기 어렵다. |
| `WarehouseToHome` | numeric | 정수 `5..127` | CSV observed range | 높음 | 배송/처리 마찰을 반영하는 레버로 해석 가능하다. 다만 값이 커질수록 더 나빠지는 축일 가능성이 높다. |
| `PreferredPaymentMode` | categorical | `Cash on Delivery`, `Credit Card`, `Debit Card`, `E wallet`, `UPI` | 전처리 후 정규화 | 중간 | 결제 수단 성향. 전체 코호트 옵션으로는 가능하지만 월간 전략 레버로는 다소 간접적이다. |
| `Gender` | categorical | `Female`, `Male` | 전처리 후 정규화 | 매우 낮음 | 운영 전략 레버로 노출하는 것은 부적절하다. 세그먼트 컨텍스트로만 다루는 편이 맞다. |
| `HourSpendOnApp` | numeric | 정수 `0..5` | CSV observed range | 높음 | engagement 를 반영하는 핵심 행동 레버로 볼 수 있다. |
| `NumberOfDeviceRegistered` | numeric | 정수 `1..6` | CSV observed range | 낮음 | 고객 관계/정착 정도를 반영하지만 단기 전략 레버로는 약하다. |
| `PreferedOrderCat` | categorical | `Fashion`, `Grocery`, `Laptop & Accessory`, `Mobile`, `Others` | 전처리 후 정규화 | 중간 | 코호트 성격 설명에는 유용하지만 direct action 레버는 아니다. |
| `SatisfactionScore` | ordinal numeric | 정수 `1..5` | CSV observed range | 매우 높음 | strategy options 에서 가장 직관적인 핵심 레버다. 값이 커질수록 긍정 축이다. |
| `MaritalStatus` | categorical | `Divorced`, `Married`, `Single` | 전처리 후 정규화 | 매우 낮음 | 운영 전략 레버로 다루면 안 되고 코호트 컨텍스트 값으로만 다루는 것이 맞다. |
| `NumberOfAddress` | numeric | 정수 `1..22` | CSV observed range | 낮음 | 충성도/정착도 proxy 로 보이지만 direct monthly action 레버로는 부적절하다. |
| `Complain` | binary numeric | `0` 또는 `1` | CSV observed range | 높음 | 불만 발생 여부. 핵심 리스크 레버로 다룰 수 있다. 값이 커질수록 부정 축이다. |
| `OrderAmountHikeFromlastYear` | numeric | 정수 `11..26` | CSV observed range | 중간 | 가격/매출 변화 신호로 해석 가능하지만 단기 전략 레버로 쓰려면 의미 설명이 필요하다. |
| `CouponUsed` | numeric | 정수 `0..16` | CSV observed range | 높음 | 할인/혜택 강도와 연결되는 전형적 전략 레버다. |
| `OrderCount` | numeric | 정수 `1..16` | CSV observed range | 높음 | 이용 빈도/활성도를 보여주는 핵심 레버다. |
| `DaySinceLastOrder` | numeric | 정수 `0..46` | CSV observed range | 높음 | recency 를 반영한다. 값이 커질수록 일반적으로 더 나쁜 축이다. |
| `CashbackAmount` | numeric | 실수 `0..324.99` | CSV observed range | 높음 | 혜택 강도와 직접 연결된다. 할인 의존도 리스크와 함께 해석해야 한다. |

## 6. Strategy Options 에서의 필드 계층화

모든 raw feature 를 동일한 수준의 전략 옵션으로 노출하는 것은 좋지 않다.

strategy options 영역은 아래 3개 층으로 나누는 것이 맞다.

### 6.1 핵심 전략 레버

이 그룹은 플레이어가 직접 조정하는 전략 옵션으로 기본 화면에 노출해도 된다.

- `WarehouseToHome`
- `HourSpendOnApp`
- `SatisfactionScore`
- `Complain`
- `CouponUsed`
- `OrderCount`
- `DaySinceLastOrder`
- `CashbackAmount`

이 그룹의 공통점은 다음과 같다.

- 운영 전략과 연결해 설명하기 쉽다.
- 월간 액션의 영향 방향을 상상하기 쉽다.
- 모델 결과 해석과도 직접 연결된다.

### 6.2 보조 전략/맥락 필드

이 그룹은 고급 설정으로는 의미가 있지만 기본 strategy options 에 항상 노출할 필요는 없다.

- `PreferredPaymentMode`
- `PreferedOrderCat`
- `OrderAmountHikeFromlastYear`
- `NumberOfDeviceRegistered`
- `NumberOfAddress`

이 그룹은 코호트 특성 또는 간접 전략 신호로 해석하는 편이 맞다.

### 6.3 시나리오/세그먼트 컨텍스트 필드

이 그룹은 사용자의 월간 전략 선택이라기보다, 어떤 고객 세그먼트를 플레이 중인가를 정하는 값에 가깝다.

- `Tenure`
- `PreferredLoginDevice`
- `CityTier`
- `Gender`
- `MaritalStatus`

이 그룹은 기본 strategy options 에서 숨기고, 아래 둘 중 하나로 다루는 것이 맞다.

- 세션 시작 시 scenario seed 값
- 고급 sandbox 모드의 세그먼트 편집 값

특히 `Gender`, `MaritalStatus` 는 운영 전략 조절 축으로 노출하는 것이 부적절하다.

## 7. 방향 기반 UX 와 절대값 계약의 분리

strategy options UI 는 사용자가 전략적으로 사고할 수 있도록 방향 기반 표현을 제공할 수 있다.

예를 들면 아래와 같은 표현은 가능하다.

- 배송 마찰을 줄인다
- 만족도를 높인다
- 불만 발생을 낮춘다
- 쿠폰 사용량을 늘린다
- 주문 공백을 줄인다

하지만 최종 모델 계약은 방향값이 아니라 절대값이어야 한다.

즉 UX 에서의 `증가`, `감소`, `유지` 는 상호작용 표현일 뿐이고, 제출 직전에는 반드시 아래 조건을 만족하는 final state 로 해석돼야 한다.

- numeric 은 단일 bounded value
- categorical 은 단일 enum value
- binary 는 단일 `0/1` value

이 원칙이 중요한 이유는 다음과 같다.

1. 모델은 상대 방향이 아니라 최종 상태 벡터를 받는다.
2. replay 와 audit 시에도 절대값 상태가 있어야 재현 가능하다.
3. preset, slider, button, AI recommendation 등 어떤 UX 표현을 쓰더라도 backend 계약은 흔들리지 않는다.

## 8. 의미 역전이 있는 필드의 UX 주의점

일부 필드는 값이 커지는 것이 좋은 것이 아니라 나쁜 상태를 의미한다.

대표적으로 아래 필드가 그렇다.

- `WarehouseToHome`
- `Complain`
- `DaySinceLastOrder`

따라서 strategy options UI 에서 이 필드들을 raw 이름 그대로 `증가/감소` 로 보여주면 의미 역전이 일어날 수 있다.

권장 방식은 아래와 같다.

- raw field 이름 대신 business-facing label 을 사용한다.
- 사용자가 좋은 방향과 나쁜 방향을 직관적으로 이해할 수 있게 한다.
- 내부 계약만 raw field 기준으로 유지한다.

예를 들어 UX 문구는 아래와 같은 방향이 더 적합하다.

- `WarehouseToHome` 대신 `배송 마찰`
- `Complain` 대신 `불만 압력`
- `DaySinceLastOrder` 대신 `최근 주문 공백`

반대로 아래 필드는 값이 커질수록 대체로 긍정 축으로 읽기 쉽다.

- `SatisfactionScore`
- `HourSpendOnApp`
- `OrderCount`

이 필드들은 strategy options 의 핵심 조절 손잡이로 쓰기 좋다.

## 9. Validation 정책

strict schema 기반 구조에서는 validation 실패를 조용히 흡수하면 안 된다.

권장 정책은 다음과 같다.

1. FE 는 입력 단계에서 invalid 상태를 즉시 표시한다.
2. FE 는 invalid form 상태에서는 제출을 막는다.
3. BE 는 authoritative validator 로서 동일한 strict 조건을 다시 검증한다.
4. BE 는 invalid 값을 보정하지 말고 reject 해야 한다.
5. unknown enum, 빈 값, out-of-range 값은 모두 400 계열 오류로 처리해야 한다.

중요한 금지사항은 아래와 같다.

- unknown category 를 가장 가까운 값으로 대체하는 것
- numeric 값을 조용히 min/max 안으로 clamp 하는 것
- null 을 median 으로 자동 치환하는 것
- runtime 에 hidden mapper 가 다시 값을 비틀어 넣는 것

## 10. Strategy Preset 의 위치 재정의

현재의 preset policy 는 완전히 사라져야 하는 것이 아니라, 위치가 바뀌어야 한다.

앞으로 preset 의 역할은 아래와 같이 재정의하는 것이 맞다.

- preset 은 canonical scoring contract 가 아니다.
- preset 은 strategy options form 을 빠르게 채우는 shortcut 이다.
- preset 을 선택해도 최종 제출은 언제나 strict raw model input 이어야 한다.

즉 preset 은 `결정 자체` 가 아니라 `form prefill template` 로 내려와야 한다.

이렇게 바꾸면 아래가 가능해진다.

1. 사용자는 preset 을 고른 뒤 세부 레버를 추가 조정할 수 있다.
2. 모델 입력이 항상 드러나므로 설명 가능성이 올라간다.
3. replay 에서 실제 제출 상태를 그대로 재현할 수 있다.

## 11. 권장 제출 계약의 개념적 형태

최종 scoring 요청은 `decision` 이 아니라 아래 정보를 가져야 한다.

1. 세션 식별 정보
2. 현재 턴 메타데이터
3. strict raw model input
4. 필요하면 incident context

여기서 핵심은 `model input` 이 canonical payload 중심이어야 한다는 점이다.

`incident_id` 는 별도 context 로 유지될 수 있지만, 모델 입력 자체를 대체하면 안 된다.

## 11.1 시나리오 충격 레이어 운영 원칙

시나리오 이벤트가 `raw model input` 을 직접 흔드는 구조를 유지할 수는 있다. 다만 이 경우에도 시나리오 충격값은 반드시 `model input` 의 native unit 을 따라야 한다.

즉 아래 원칙을 지켜야 한다.

1. 정수형 필드는 정수 step 단위로만 흔든다.
2. binary 필드는 `0/1` 의미에 맞는 `-1, 0, +1` 수준의 변화만 허용한다.
3. categorical 필드는 시나리오 충격으로 직접 바꾸지 않는다.
4. fractional multiplier 나 fractional addition 으로 discrete field 를 숨겨서 흔들지 않는다.
5. 시나리오 충격 후 최종 값은 strict schema 안에 있어야 한다.

예를 들어 아래는 좋은 예다.

- `OrderCount: -1`
- `DaySinceLastOrder: +2`
- `SatisfactionScore: -1`
- `Complain: +1`

반면 아래는 피해야 한다.

- `SatisfactionScore: -0.25`
- `Complain: +0.15`
- `OrderCount * 0.94`

왜냐하면 이런 값은 최종적으로는 반올림/보정에 의존하게 되어, strict raw model input 계약을 다시 흐리게 만들기 때문이다.

## 12. 이 구조에서 strategy options 가 실제로 의미하는 것

이 구조로 바뀌면 strategy options 는 더 이상 `정책 이름 목록` 이 아니다.

그 대신 strategy options 는 아래를 의미하게 된다.

- 플레이어가 조절 가능한 상태 레버 목록
- 그 레버의 허용 범위와 방향성
- 최종적으로 모델에 들어갈 명시적 상태 벡터

즉 사용자는 이제 `coupon_push` 같은 추상 행동명을 누르는 것이 아니라,
실제로 어떤 상태를 얼마나 바꾼 뒤 다음 달 churn risk 를 보겠다는 선택을 하게 된다.

이 변화는 strategy simulator 의 핵심 메시지와도 더 잘 맞는다.

- 사용자는 상태를 읽고
- 전략 레버를 직접 조절하고
- 그 결과를 모델 예측으로 확인한다

이 구조가 현재 `strategy options` 영역이 가야 할 올바른 방향이다.

## 13. 한 줄 요약

`strategy options` 는 `preset decision picker` 가 아니라 `strict raw model input` 을 만들어내는 플레이어 전략 form 이어야 한다. categorical 필드는 exact enum, numeric 필드는 bounded range, binary 필드는 `0/1` 로 고정하고, preset 은 최종 계약이 아니라 form prefill 로만 사용해야 한다.
