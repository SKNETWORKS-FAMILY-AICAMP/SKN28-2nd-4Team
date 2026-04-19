# 데이터 전략 요구사항 문서: Churn Power Modeling & Dataset Strategy

## 0. 문서 목적

본 문서는 프로젝트의 데이터 전략을 아래 관점에서 정의한다.

- 어떤 데이터셋을 핵심 축으로 볼 것인가
- 단순 churn classification이 아니라 **churn degree / churn power** 를 어떻게 다룰 것인가
- raw event / multi-table 데이터를 어떤 순서로 가공할 것인가
- 프론트엔드가 보여주는 `churnRisk`, `user_base`, `retention_score`, `lock_in_score`, `trust_score` 와 데이터 작업을 어떻게 연결할 것인가

이 문서는 모델 구현 상세보다 먼저, **무엇을 보고 어떤 형태의 데이터 표현으로 바꿔야 하는지** 를 정리하는 요구사항 문서다.

비범위:

- 특정 라이브러리 선택
- 모델 코드 세부 구현
- GPU 최적화나 하이퍼파라미터 튜닝 상세
- 시각 디자인

---

## 1. 문제 재정의

이 프로젝트에서 중요한 것은 단순히 “이 고객이 떠나는가”를 맞추는 것이 아니다.

우리가 실제로 보고 싶은 것은 아래 질문이다.

1. 현재 사용자 집단의 **이탈 압력(churn pressure)** 은 얼마나 높은가
2. 그 압력은 어떤 요인에서 커지고 있는가
3. 전략 선택 이후 그 압력이 어떻게 줄거나 커지는가
4. 그 변화가 `user_base`, `retention_score`, `lock_in_score`, `trust_score` 에 어떻게 반영되는가

즉 이 프로젝트의 데이터 문제는 아래처럼 재해석된다.

- 기존 질문: `X -> churn 여부` 를 맞출 수 있는가
- 이번 질문: `과거 행동/거래/지원/구독 흐름 -> 현재 churn power와 미래 이탈 강도` 를 설명할 수 있는가

---

## 2. 제품 관점 핵심 요구

프론트엔드는 사용자의 선택에 따라 단순 label이 아니라 **위험 강도** 와 **예상 사용자 변화** 를 보여줘야 한다.

따라서 데이터 계층은 최소 아래 출력을 만들 수 있어야 한다.

1. 개별 사용자 또는 세그먼트 수준의 `churn risk probability`
2. cohort 수준의 `expected churn count`
3. 다음 기간의 `expected user_base delta`
4. `lock-in`, `trust`, `support burden`, `activity decay` 같은 상태 해석 변수

결론적으로 데이터 작업의 1차 목표는 **정답 label 하나** 가 아니라, 아래와 같은 엔진 친화적 상태 신호를 만드는 것이다.

- churn pressure
- retention score
- lock-in score
- trust score
- reward / value proxy

---

## 3. 큰 그림 전략

### 3.1 기본 원칙

이 데이터 전략은 아래 순서를 따른다.

1. **baseline 먼저**
   - direct churn label이 있는 단일 테이블 데이터로 가장 빠른 baseline을 만든다.
2. **raw-first 확장**
   - raw event / multi-table 데이터에서 사용자 단위 time panel을 만든다.
3. **churn degree로 확장**
   - binary label을 넘어 spend drop, activity drop, renewal risk, trust damage를 같이 본다.
4. **state calibration 연결**
   - 모델 출력과 feature group을 엔진 상태 변수에 맵핑한다.

### 3.2 왜 raw-first 인가

raw 데이터를 먼저 보는 이유는 다음과 같다.

- `언제부터 약해졌는지` 를 볼 수 있다.
- `어떤 행동 감소가 이탈 전조였는지` 를 볼 수 있다.
- `join date`, `first purchase`, `renewal`, `support timing` 을 기준으로 leakage 없이 feature를 만들 수 있다.
- 나중에 FE에서 보여줄 월별 위험 곡선과 더 잘 맞는다.

즉 raw 데이터는 단순 예측 정확도보다, **이탈의 강도와 방향을 설명하는 상태 변수 설계** 에 더 중요하다.

---

## 4. 도메인 전략

이 프로젝트는 “쿠팡처럼 일반 구매와 멤버십 가치가 함께 존재하는 서비스” 에 가까운 도메인을 참고하려고 한다.

따라서 데이터셋은 아래 세 층으로 나누어 본다.

### 4.1 Core Service Retention 축

주요 질문:

- 멤버십/구독/관계 유지 구조에서 churn pressure는 어떻게 생기는가

우선 데이터셋:

- `ecommerce_company_client_churn_data`
- `ecommerce_customer_data`
- `churn_preprocessed`
- `saas_subscription_churn`
- `streaming_subscription_churn_model`
- `kkbox_churn_prediction_challenge`

역할:

- direct churn baseline
- support / billing / renewal / usage 기반 해석
- relationship-driven retention 구조 확인

### 4.2 Retail / Commerce Behavior 축

주요 질문:

- 일반 구매 행동과 활동 감소는 어떻게 churn pressure로 이어지는가

우선 데이터셋:

- `retailrocket_raw`
- `retailrocket_processed`
- `olist`
- `x5`

역할:

- 일반 구매 funnel
- inactivity / repeat purchase decay
- review / delivery / trust deterioration
- loyalty / points / purchase history 보강

### 4.3 Intervention / Effect Prior 축

주요 질문:

- 어떤 action이 churn pressure를 완화하는 방향으로 작동할 수 있는가

우선 데이터셋:

- `hillstrom`
- `lenta`
- `criteo`
- `orange_belgium_churn_uplift`
- `megafon`

역할:

- treatment-response prior
- uplift / intervention effect reference
- action layer calibration 참고

---

## 5. 데이터셋 우선순위 요구

### 5.1 1차 우선순위

1. `retailrocket_raw`
2. `saas_subscription_churn`
3. `olist`
4. `ecommerce_company_client_churn_data`

이 순서를 우선으로 두는 이유:

- `retailrocket_raw`: 일반 구매 행동과 inactivity를 raw event로 볼 수 있음
- `saas_subscription_churn`: membership / subscription / support / billing 축을 함께 볼 수 있음
- `olist`: trust / review / delivery / repeat purchase proxy를 만들 수 있음
- `ecommerce_company_client_churn_data`: direct churn snapshot baseline이면서 support/revenue가 함께 있음

### 5.2 2차 우선순위

- `kkbox_churn_prediction_challenge`
- `x5`
- `retailrocket_processed`
- `streaming_subscription_churn_model`

역할:

- sequence backbone 강화
- loyalty / points / purchase aggregation 확인
- 빠른 regression / classification proxy 확인

---

## 6. “어떻게 봐야 하는가” 요구사항

각 데이터셋은 아래 순서로 읽어야 한다.

### 6.1 1단계: 엔티티 확인

반드시 먼저 정해야 하는 것:

- unique entity id
  - 예: `visitorid`, `account_id`, `customer_unique_id`, `client_id`, `msno`
- entity level
  - customer-level 인가
  - account-level 인가
  - event-level 인가

### 6.2 2단계: 시간 anchor 확인

반드시 정해야 하는 것:

- join anchor
  - `signup_date`
  - `registration_init_time`
  - `first_issue_date`
  - 없으면 `first_purchase` 또는 `first_seen event`
- as-of date
  - 어떤 시점을 기준으로 feature를 잘라낼 것인가
- panel unit
  - week
  - month
  - billing cycle

### 6.3 3단계: direct y / derived y 구분

- direct `y` 가 있으면 먼저 baseline classification을 한다.
- direct `y` 가 없으면 proxy label을 설계한다.

예시:

- `retailrocket_raw`
  - `inactive_next_30d`
  - `next_30d_purchase_flag`
  - `next_30d_revenue`
- `olist`
  - `no_repurchase_next_90d`
  - `delivery_delay`
  - `low_review_risk`
- `saas_subscription_churn`
  - `churn_flag`
  - `days_until_churn`
  - `next_30d_mrr_loss`

### 6.4 4단계: leakage 방지

날짜를 그대로 feature로 넣는 것은 원칙적으로 피한다.

직접 쓰지 말아야 하는 예:

- `last_purchase_datetime` 자체
- 예측 시점 이후를 포함하는 `membership_expire_date`
- 전체 기간 정보를 이미 반영한 집계치

대신 아래처럼 바꿔야 한다.

- `days_since_join`
- `days_since_last_purchase`
- `days_to_expiry`
- `purchase_count_last_30d`
- `spend_last_30d`
- `activity_drop_30d_vs_prev_30d`
- `support_tickets_last_30d`

그리고 split도 random split보다 **time split** 을 우선한다.

### 6.5 5단계: state variable 후보 확인

최종적으로는 각 데이터셋이 아래 상태 변수 중 무엇을 보정하는지 확인해야 한다.

- `churn_pressure`
- `retention_score`
- `lock_in_score`
- `trust_score`
- `incident_pressure`
- `user_base`

---

## 7. 예측 대상 요구사항

### 7.1 Classification target

최소 아래 target 후보를 지원할 수 있어야 한다.

- `churn_next_30d`
- `inactive_next_30d`
- `no_purchase_next_60d`
- `non_renewal_next_cycle`

### 7.2 Regression target

아래 target은 가능하면 함께 본다.

- `days_until_churn`
- `next_30d_spend`
- `next_30d_order_count`
- `usage_drop_ratio`
- `value_loss_ratio`

### 7.3 Churn power score

최종적으로는 binary label 하나보다 아래 형태의 continuous score가 필요하다.

```text
churn_power(t)
= w1 * recency_risk
+ w2 * activity_drop
+ w3 * spend_drop
+ w4 * renewal_risk
+ w5 * support_burden
+ w6 * trust_damage
```

중요:

- 위 식은 개념적 설명용이다.
- 실제 프로젝트에서는 `w1`~`w6` 를 사람이 고정값으로 직접 정하는 방식보다,
  **표준화된 panel feature를 입력으로 받는 MLP 기반 딥러닝 모델이 학습하도록 설계**하는 것을 기본 방향으로 둔다.
- 즉 `recency`, `activity`, `spend`, `renewal`, `support`, `trust` 관련 feature group을 입력으로 넣고,
  MLP가 최종 `churn power` 또는 `churn risk probability` 를 출력하도록 구성한다.
- 필요하면 feature group 단위 aggregation 또는 attribution을 추가해,
  최종 score가 어떤 요인에서 커졌는지 FE와 엔진 해석에 다시 연결한다.

이 값은 0~100 범위로 정규화해 FE의 `churnRisk` 와 연결한다.

---

## 8. 모델 전략 요구사항

### 8.1 1단계 모델

- direct churn label이 있는 단일 테이블 baseline
- 목적: 파이프라인 sanity check, threshold, class imbalance, feature importance 확인

### 8.2 2단계 모델

- raw / multi-table 데이터를 panel dataset으로 변환한 후 분류/회귀 수행
- 목적: churn degree, future value, inactivity 예측
- 이 단계에서 churn power prototype은 **tabular MLP** 를 기본 실험 모델로 둔다.
- 입력은 leakage 없는 panel feature이며, 출력은 아래 중 하나 또는 복수 조합이다.
  - `churn_next_30d` 같은 binary classification target
  - `next_30d_spend`, `days_until_churn` 같은 regression target
  - 0~100 범위로 정규화할 수 있는 continuous `churn power`

### 8.3 3단계 모델

- 도메인별 encoder 또는 late fusion ensemble
- 목적: subscription / retail / support 신호를 함께 읽는 representation 정리
- 여기서의 핵심 후보는 `retail / subscription / support` feature block을 각각 정리한 뒤,
  최종 head를 **MLP 기반 DL score model** 로 두는 방식이다.

### 8.4 권장 아키텍처: 3-브랜치 + 최종 churn power head

현재 권장 방향은 서로 다른 분야의 신호를 한 번에 raw concat 하는 것이 아니라,
아래 3개 브랜치 모델을 먼저 둔 뒤 마지막에 이를 합치는 구조다.

1. **Commerce / Value branch**
   - 구매, 주문, 결제, 매출, 활동량 감소 신호
2. **Membership / Subscription branch**
   - 가입, tenure, plan, renewal, expiry, contract, loyalty 신호
3. **Trust / Intervention branch**
   - support, complaint, review, csat, refund, promo, treatment 신호

이후 마지막 레이어는 아래 역할을 가진다.

- 세 브랜치의 representation 또는 extracted feature를 입력으로 받는다.
- 최종 `churn power` 또는 `churn risk probability` 를 출력한다.
- 구조적으로는 **ensemble 담당 head** 이며, 프로젝트의 최종 위험 요약 모델로 작동한다.

중요:

- 각 브랜치는 서로 다른 데이터셋을 그대로 합쳐 학습하는 것이 아니라,
  데이터셋별 panel / normalization / feature extraction을 마친 뒤 공통 feature block으로 정리된 입력을 받는다.
- 따라서 실제 순서는 아래와 같다.

1. dataset grouping
2. feature normalization rule 정의
3. feature extraction / EDA
4. 브랜치별 학습
5. 최종 churn power head 학습

중요:

- 서로 다른 데이터셋을 처음부터 raw concat하여 하나의 DL 모델로 바로 학습하는 방식은 1차 목표가 아니다.
- 먼저 해야 하는 것은 **representation standardization** 이다.
- 따라서 MLP도 raw 데이터를 바로 먹는 것이 아니라,
  `entity_id + as-of date + panel window` 기준으로 정리된 feature table 위에서 학습하는 것을 원칙으로 한다.

즉 우선순위는 아래다.

1. panel schema 통일
2. 도메인별 baseline 구축
3. shared feature space 설계
4. 그 다음 transfer / fine-tuning / late fusion 검토

---

## 9. 프론트엔드 연결 요구

데이터 작업의 출력은 최종적으로 아래 프론트 정보 구조와 연결되어야 한다.

- `user_base`
- `retention_score`
- `lock_in_score`
- `trust_score`
- `incident_pressure`
- `churnRisk`

따라서 모델 결과는 아래 두 층으로 나뉘어야 한다.

1. **micro output**
   - 개별 사용자 또는 세그먼트 risk
2. **macro output**
   - cohort별 expected churn count
   - predicted users next month
   - churn pressure trend

즉 데이터 계층은 단순 예측기가 아니라, FE가 월별 전략 대시보드에서 읽을 수 있는 **위험 요약기** 역할을 해야 한다.

---

## 10. 산출물 요구

이 PRD 기준으로 최소 아래 산출물이 필요하다.

1. 데이터셋별 `README.md`
   - 도메인, 컬럼, direct y, representation 정리
2. 데이터셋별 panel 설계 문서
   - `entity_id`, `join_anchor`, `panel_unit`, `y_class`, `y_reg`, leakage note
3. baseline notebook 또는 script
   - direct churn classification 먼저 확인
4. raw dataset aggregation notebook
   - `retailrocket_raw`, `saas_subscription_churn`, `olist` 우선
5. churn power prototype
   - FE `churnRisk` 로 연결할 수 있는 score 실험

---

## 11. 완료 기준

이 문서 기준으로 데이터 전략이 준비되었다고 보려면 아래가 만족되어야 한다.

1. 핵심 데이터셋 4개 이상에서 `entity_id` 와 `join_anchor` 가 정의되어 있다.
2. direct `y` 와 derived `y` 후보가 구분되어 있다.
3. leakage 없는 time-aware feature 설계 규칙이 명시되어 있다.
4. FE의 `churnRisk` 와 연결 가능한 churn power 초안이 존재한다.
5. raw-first 전략과 baseline 전략의 역할 분리가 설명되어 있다.

---

## 12. 현재 권장 다음 단계

1. `retailrocket_raw` panel 설계
2. `saas_subscription_churn` panel 설계
3. `olist` 의 churn proxy 설계
4. `ecommerce_company_client_churn_data` baseline 정리
5. 4개 데이터셋의 공통 feature schema 초안 작성

이 다섯 단계를 완료하면, 이후 모델링과 FE 연결 논의가 훨씬 빠르게 정리될 수 있다.
