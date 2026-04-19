# 핵심 데이터셋 패널 스키마 요구사항 문서: Core Dataset Panel Schema Specification

## 0. 문서 목적

본 문서는 현재 핵심으로 보는 4개 데이터셋에 대해,
실제로 학습 가능한 `panel schema` 를 어떤 방식으로 만들지 구체적으로 정의한다.

대상 데이터셋:

1. `retailrocket_raw`
2. `saas_subscription_churn`
3. `olist`
4. `ecommerce_company_client_churn_data`

이 문서의 목적은 아래를 확정하는 것이다.

- `entity_id`
- `join_anchor`
- `as_of_date`
- `panel_unit`
- observation window
- `y_class`
- `y_reg`
- `y_churn_power` 생성 방향
- leakage 방지 규칙
- branch A/B/C feature block으로 어떻게 분해할지

---

## 1. 큰 원칙

### 1.1 한 행의 의미

최종적으로 모든 core dataset은 아래 의미를 가진 행으로 바꾼다.

```text
한 행 = 특정 entity가 특정 시점(as_of_date)까지 보여준 상태 요약 + 이후 horizon에 대한 타깃
```

즉 raw 이벤트나 주문 레코드를 그대로 쓰지 않고,
반드시 `as-of` 기준으로 잘린 panel row를 만들어야 한다.

### 1.2 time-aware와 snapshot-only 구분

이 문서는 core dataset을 두 종류로 나눈다.

1. **strict time panel 가능 데이터셋**
   - `retailrocket_raw`
   - `saas_subscription_churn`
   - `olist`
2. **snapshot-only supervised anchor 데이터셋**
   - `ecommerce_company_client_churn_data`

중요:

- strict time panel 데이터셋은 월별 또는 주별 패널을 실제로 생성한다.
- snapshot-only 데이터셋은 동일한 형태의 패널을 완전 복원하기 어렵다.
- 따라서 `ecommerce_company_client_churn_data` 는 **브랜치 학습의 supervised anchor** 로 사용하고,
  최종 time generalization의 주된 검증셋으로는 쓰지 않는다.

### 1.3 split 원칙

- strict time panel 데이터셋: **time split**
- snapshot-only anchor 데이터셋: 보조용 random split 가능

---

## 2. 공통 패널 스키마

## 2.1 공통 index 컬럼

| 컬럼 | 의미 | 비고 |
| --- | --- | --- |
| `sample_id` | 패널 row 고유 ID | `{dataset_id}:{entity_id}:{as_of_date}` 권장 |
| `dataset_id` | 데이터셋 이름 | 예: `retailrocket_raw` |
| `domain_id` | 상위 도메인 | `commerce`, `subscription`, `service`, `retail` 등 |
| `entity_id` | 사용자 / 계정 / 고객 ID | 원본 key에서 표준화 |
| `panel_unit` | `week`, `month`, `billing_cycle`, `snapshot` | 데이터셋별 고정 |
| `as_of_date` | feature를 자르는 기준 시점 | 이 시점 이후 정보는 feature 금지 |
| `join_anchor_date` | 가입 / 최초 활동 기준 시점 | `days_since_join` 계산용 |
| `observation_start_date` | 관측 시작 | 보통 `as_of_date - 89d` 등 |
| `observation_end_date` | 관측 종료 | `as_of_date` 와 동일 |
| `horizon_end_date` | 타깃을 보는 종료 시점 | 예: `as_of_date + 30d` |

## 2.2 공통 메타 컬럼

| 컬럼 | 의미 |
| --- | --- |
| `entity_age_days` | `join_anchor_date` 이후 경과일 |
| `active_before_as_of` | 기준 시점 이전에 활동이 있었는지 |
| `eligible_for_label` | horizon label 생성 가능한지 |
| `branch_a_mask` | Commerce/Activity branch feature 존재 여부 |
| `branch_b_mask` | Membership/Subscription branch feature 존재 여부 |
| `branch_c_mask` | Trust/Intervention branch feature 존재 여부 |

## 2.3 공통 target 컬럼

| 컬럼 | 의미 | 타입 |
| --- | --- | --- |
| `y_class_primary` | 기본 binary target | binary |
| `y_class_secondary` | 보조 binary target | optional binary |
| `y_reg_primary` | 기본 연속 target | float |
| `y_reg_secondary` | 보조 연속 target | optional float |
| `y_churn_power` | 0~100 normalized churn power target | float |

## 2.4 공통 churn power target 조립 원칙

strict time panel에서는 아래 형태를 권장한다.

```text
y_churn_power
= 40 * churn_like_event
+ 25 * activity_drop_ratio_future
+ 20 * value_loss_ratio_future
+ 15 * trust_damage_proxy_future
```

설명:

- `churn_like_event`: 구매 중단 / 구독 해지 / no renewal 같은 binary event
- `activity_drop_ratio_future`: future window 활동 감소율
- `value_loss_ratio_future`: future spend / order / MRR 감소율
- `trust_damage_proxy_future`: future review / complaint / refund 악화

이 식은 고정 운영 규칙이 아니라,
최종적으로 `ensemble head` 에 들어가기 전 **supervision target** 을 만드는 기준으로 사용한다.

---

## 3. Branch별 공통 feature block 요구

각 dataset panel row는 아래 세 block으로 분해한다.

### 3.1 Branch A block

- `a_days_since_last_activity`
- `a_purchase_count_30d`
- `a_purchase_sum_30d`
- `a_purchase_sum_90d`
- `a_order_count_30d`
- `a_session_count_30d`
- `a_view_count_30d`
- `a_cart_count_30d`
- `a_activity_drop_ratio_30d_vs_prev_30d`
- `a_spend_drop_ratio_30d_vs_prev_30d`
- `a_value_score_proxy`

### 3.2 Branch B block

- `b_days_since_join`
- `b_tenure_days`
- `b_subscription_plan_code`
- `b_auto_renew_flag`
- `b_days_to_expiry`
- `b_cancel_flag_30d`
- `b_renewal_failure_count_90d`
- `b_plan_change_up_flag_90d`
- `b_plan_change_down_flag_90d`
- `b_usage_intensity_30d`
- `b_usage_drop_ratio_30d_vs_prev_30d`
- `b_loyalty_benefit_use_30d`

### 3.3 Branch C block

- `c_support_ticket_count_30d`
- `c_support_ticket_count_90d`
- `c_complaint_flag_30d`
- `c_complaint_count_90d`
- `c_csat_last`
- `c_review_score_mean_90d`
- `c_low_review_ratio_90d`
- `c_refund_amount_90d`
- `c_escalation_count_90d`
- `c_delivery_delay_mean_30d`
- `c_treatment_flag`
- `c_promo_exposure_count_30d`
- `c_response_flag`
- `c_trust_damage_proxy`

---

## 4. 데이터셋 1: retailrocket_raw

## 4.1 justification

이 데이터셋은 일반 구매/행동 감소를 가장 직접적으로 보여주는 raw backbone이다.

- `visitorid`
- `timestamp`
- `event`
- `transactionid`

구조가 명확해서,
`쿠팡 일반 구매 행동 감소` 를 설명하는 Branch A의 핵심 입력으로 적합하다.

## 4.2 panel 정의

| 항목 | 정의 |
| --- | --- |
| `entity_id` | `visitorid` |
| `join_anchor` | 해당 visitor의 first event timestamp |
| `panel_unit` | `month` 기본, 필요 시 `week` 보조 |
| `as_of_date` | 각 월의 month-end UTC |
| observation window | 최근 90일 (`as_of_date - 89d ~ as_of_date`) |
| horizon | 다음 30일 |

## 4.3 feature block 사용

### Branch A

주력 사용:

- `a_days_since_last_activity`
- `a_view_count_30d`
- `a_cart_count_30d`
- `a_purchase_count_30d`
- `a_session_count_30d`
- `a_activity_drop_ratio_30d_vs_prev_30d`
- `a_conversion_view_to_cart_30d`
- `a_conversion_cart_to_purchase_30d`

### Branch B

거의 없음.

- `b_days_since_join` 정도만 약하게 생성 가능
- 나머지는 `branch_b_mask = 0` 처리 가능

### Branch C

직접 신호가 매우 약함.

- promo / support / review 없음
- `branch_c_mask = 0` 기본

## 4.4 target 정의

| target | 정의 |
| --- | --- |
| `y_class_primary` | `inactive_next_30d` = 다음 30일 동안 어떤 event도 없음 |
| `y_class_secondary` | `next_30d_purchase_flag` = 다음 30일 내 purchase 존재 |
| `y_reg_primary` | `next_30d_revenue` |
| `y_reg_secondary` | `next_30d_purchase_count` |

## 4.5 leakage 금지 사항

- `as_of_date` 이후 event 사용 금지
- `transactionid` 가 있는 event라도 미래 구간 정보는 차단
- item property 사용 시 `timestamp <= as_of_date` 조건 필수

## 4.6 normalization

- count 계열: `log1p`
- recency 계열: risk 방향 통일
- ratio 계열: `[0, 1]` 또는 `[-1, 1]` clip

---

## 5. 데이터셋 2: saas_subscription_churn

## 5.1 justification

이 데이터셋은 membership / billing / support / usage / churn date가 함께 있어,
Branch B와 Branch C를 동시에 강하게 학습시킬 수 있는 핵심 backbone이다.

## 5.2 panel 정의

| 항목 | 정의 |
| --- | --- |
| `entity_id` | `account_id` |
| `join_anchor` | `signup_date` |
| `panel_unit` | `month` |
| `as_of_date` | 각 month-end |
| observation window | 최근 90일 |
| horizon | 다음 30일 또는 다음 billing cycle |

## 5.3 feature block 사용

### Branch A

- `a_activity_drop_ratio_30d_vs_prev_30d`
- `a_value_score_proxy` via `mrr_amount`, `arr_amount`

### Branch B

주력 사용:

- `b_days_since_join`
- `b_subscription_plan_code`
- `b_auto_renew_flag`
- `b_days_to_expiry`
- `b_plan_change_up_flag_90d`
- `b_plan_change_down_flag_90d`
- `b_usage_intensity_30d`
- `b_usage_drop_ratio_30d_vs_prev_30d`

### Branch C

주력 사용:

- `c_support_ticket_count_30d`
- `c_refund_amount_90d`
- `c_escalation_count_90d`
- `c_csat_last`
- `c_trust_damage_proxy`

## 5.4 target 정의

| target | 정의 |
| --- | --- |
| `y_class_primary` | `churn_next_30d` |
| `y_class_secondary` | `non_renewal_next_cycle` |
| `y_reg_primary` | `days_until_churn` |
| `y_reg_secondary` | `next_30d_mrr_loss` |

## 5.5 leakage 금지 사항

- `churn_date <= as_of_date` 인 row는 future target 생성에서 제외
- `end_date`, `churn_event` 를 직접 feature로 사용하지 말고 `as_of_date` 기준 파생
- future support resolution 결과 누출 금지

## 5.6 normalization

- amount 계열: `log1p` + z-score
- days 계열: day 단위 통일
- categorical plan/frequency: code 또는 embedding

---

## 6. 데이터셋 3: olist

## 6.1 justification

`olist` 는 direct churn label은 없지만,
`order + payment + delivery + review` 를 모두 가져서 trust / fulfillment / repeat purchase proxy를 만들기 좋다.

즉 Branch A와 Branch C를 동시에 보강하는 핵심 데이터셋이다.

## 6.2 panel 정의

| 항목 | 정의 |
| --- | --- |
| `entity_id` | `customer_unique_id` |
| `join_anchor` | first `order_purchase_timestamp` |
| `panel_unit` | `month` |
| `as_of_date` | 각 month-end |
| observation window | 최근 90일 기본, trust는 최근 180일도 검토 |
| horizon | 다음 90일 |

## 6.3 feature block 사용

### Branch A

- `a_order_count_30d`
- `a_purchase_sum_30d`
- `a_avg_order_value_90d`
- `a_days_since_last_purchase`
- `a_product_diversity_90d`

### Branch B

- 거의 없음
- `branch_b_mask = 0` 기본

### Branch C

주력 사용:

- `c_review_score_mean_90d`
- `c_low_review_ratio_90d`
- `c_delivery_delay_mean_30d`
- `c_trust_damage_proxy`

## 6.4 target 정의

| target | 정의 |
| --- | --- |
| `y_class_primary` | `no_repurchase_next_90d` |
| `y_class_secondary` | `low_review_risk_next_30d` 또는 delayed delivery risk |
| `y_reg_primary` | `next_90d_spend` |
| `y_reg_secondary` | `next_order_gap_days` 또는 `delivery_delay_days` |

## 6.5 leakage 금지 사항

- `as_of_date` 이후 리뷰 / 배송완료 / 결제 데이터 feature 포함 금지
- 주문은 `order_purchase_timestamp <= as_of_date` 기준으로 자름
- 배송 지연은 이미 완료된 주문만 집계

## 6.6 normalization

- spend / payment: `log1p`
- review score: 낮을수록 위험 증가 방향으로 변환
- delay days: positive delay 중심으로 winsorize

---

## 7. 데이터셋 4: ecommerce_company_client_churn_data

## 7.1 justification

이 데이터셋은 strict raw panel은 아니지만,
direct churn label과 support/revenue snapshot을 같이 제공한다.

따라서 core 4개 중 유일한 **snapshot-only supervised anchor** 로 사용한다.

## 7.2 panel 정의

| 항목 | 정의 |
| --- | --- |
| `entity_id` | `user_id` |
| `join_anchor` | `user_creation_datetime` |
| `panel_unit` | `snapshot` |
| `as_of_date` | 명시적 시점 복원 어려움. 관리용으로 `last_purchase_datetime` 보관 가능하나 입력에는 직접 쓰지 않음 |
| observation window | 이미 집계된 snapshot |
| horizon | direct `status` label |

## 7.3 feature block 사용

### Branch A

- `recency`, `frequency`
- `total_sales`
- `month_revenue_eur`, `quarter_revenue_eur`, `year_revenue_eur`
- `historic_aov`, `year_aov`

### Branch B

- 직접 membership 신호는 약함
- `longevity` 를 약한 lifecycle 신호로 사용 가능

### Branch C

- `cs_tickets_good`, `cs_tickets_bad`, `cs_tickets_offered`, `cs_tickets_unoffered`
- `customer_feedback_tickets`
- `total_tickets`
- `csat`

## 7.4 target 정의

| target | 정의 |
| --- | --- |
| `y_class_primary` | `status` |
| `y_class_secondary` | 없음 |
| `y_reg_primary` | `churn_factor` |
| `y_reg_secondary` | future revenue proxy는 별도 정의 없이 사용 보류 |

## 7.5 leakage 관련 주의

이 데이터셋은 이미 전체 관측 결과가 snapshot으로 응축된 구조라,
strict time split 기반 일반화 검증의 주력셋으로 쓰지 않는다.

사용 원칙:

- supervised anchor
- branch pretraining 보조
- feature importance / state interpretation 참고

## 7.6 normalization

- revenue / aov 계열: currency-aware scaling
- ticket 계열: `log1p`
- recency/frequency: risk 방향 통일

---

## 8. core 4개 데이터셋 통합 순서

1. `retailrocket_raw` panel 생성
2. `saas_subscription_churn` panel 생성
3. `olist` panel 생성
4. `ecommerce_company_client_churn_data` snapshot anchor 정리
5. Branch A/B/C block 생성
6. common column contract로 저장
7. branch별 normalization / EDA
8. branch별 baseline 학습

---

## 9. 다음으로 바로 해야 할 일

1. 각 데이터셋에서 실제 column-to-canonical mapping 표 작성
2. `panel build notebook` 초안 생성
3. 30d / 90d horizon 버전 둘 다 준비
4. branch block별 missing mask 생성 규칙 확정
5. `y_churn_power` 조립 규칙 초안 실험
