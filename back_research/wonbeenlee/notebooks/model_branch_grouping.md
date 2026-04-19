# Model Branch Grouping For Churn Power

## 목적

이 문서는 현재 보유한 데이터셋을 **feature name 기준으로** 다시 읽고,
최종 `churn power` 모델을 위한 3개 브랜치에 어떻게 묶을지 정리한다.

핵심 전제는 아래와 같다.

- 최종 목표는 단일 binary churn 모델이 아니라 **churn degree / churn power** 출력이다.
- 서로 다른 도메인의 데이터셋을 그대로 합치는 것이 아니라,
  **브랜치별 feature extraction -> 브랜치별 representation -> 최종 head** 구조로 간다.
- 마지막 모델은 세 브랜치 출력을 합치는 **ensemble head** 역할을 한다.

## 방향 검토

현재 방향은 타당하다.

- `baseline`은 direct churn classification 데이터로 먼저 잡는다.
- `raw` 데이터에서는 user-time panel을 만든다.
- 각 데이터셋에서 direct `y` 또는 derived `y`를 정의한다.
- 그 다음 브랜치별 feature normalization / extraction / EDA / training 순서로 진행한다.
- 마지막에 MLP 기반 `churn power head`가 세 브랜치 representation을 합친다.

즉 지금 방향은 아래와 같이 요약할 수 있다.

```text
dataset grouping
-> panel definition
-> normalization
-> branch-wise feature extraction
-> branch model training
-> final churn power MLP head
```

## 브랜치 정의

### Branch A. Commerce / Value / Activity

읽으려는 신호:

- 구매 횟수
- 주문 빈도
- 매출 / spend / revenue
- session / usage / view / cart / purchase funnel
- recency / inactivity / value drop

대표 feature name 패턴:

- `purchase`, `order`, `sales`, `revenue`, `aov`, `amount`, `payment`, `spend`, `session`, `view`, `click`, `cart`, `usage`, `weekly_`, `total_secs`

### Branch B. Membership / Subscription / Lifecycle

읽으려는 신호:

- 가입 시점
- tenure
- plan / contract
- auto-renew / expiry / renewal
- loyalty issuance / redeem
- subscription relationship strength

대표 feature name 패턴:

- `membership`, `tenure`, `signup`, `registration`, `contract`, `plan`, `renew`, `trial`, `issue`, `redeem`, `seats`, `subscription`, `expire`

### Branch C. Trust / Support / Intervention

읽으려는 신호:

- support burden
- complaint / csat / review
- refund / escalation / error
- promo / treatment / exposure / discount / points
- action effect or trust deterioration

대표 feature name 패턴:

- `ticket`, `support`, `complain`, `satisfaction`, `csat`, `feedback`, `review`, `refund`, `error`, `escalation`, `treatment`, `group`, `segment`, `promo`, `discount`, `exposure`, `response`, `points`

## 데이터셋별 feature name 근거와 1차 그룹핑

| 데이터셋 | feature name 근거 | 1차 브랜치 | 2차 브랜치 | 비고 |
| --- | --- | --- | --- | --- |
| `retailrocket_raw` | `timestamp`, `event`, `transactionid` | A | - | raw commerce behavior backbone |
| `retailrocket_processed` | `session_*`, `click_*`, `view_*`, `purchase_*`, `target_revenue` | A | - | Branch A 빠른 sanity baseline |
| `olist` | `order_*`, `payment_*`, `review_*`, `shipping_limit_date` | A | C | commerce + trust 같이 읽힘 |
| `x5` | `purchase_sum`, `transaction_datetime`, `first_issue_date`, `points`, `treatment_flg` | A | B, C | loyalty retail이라 3브랜치 모두 연결 가능 |
| `ecommerce_customer_data` | `Online_Purchases`, `Spending_Score`, `Membership_Years`, `Discount_Usage` | A | B | 간단한 commerce-membership baseline |
| `churn_preprocessed` | `OrderCount`, `DaySinceLastOrder`, `CashbackAmount`, `Tenure`, `Complain`, `SatisfactionScore` | A | B, C | Coupang-like mixed snapshot에 가깝다 |
| `ecommerce_company_client_churn_data` | `total_sales`, `recency`, `historic_revenue_eur`, `cs_tickets_*`, `csat` | A | C | lifecycle snapshot + support/trust 강함 |
| `ibm_telco_customer_churn` | `Contract`, `tenure`, `MonthlyCharges`, `TechSupport` | B | C | subscription baseline |
| `streaming_subscription_churn_model` | `subscription_type`, `payment_plan`, `num_subscription_pauses`, `weekly_hours`, `weekly_songs_played` | B | A | subscription + usage |
| `kkbox_churn_prediction_challenge` | `registration_init_time`, `payment_plan_days`, `is_auto_renew`, `membership_expire_date`, `total_secs` | B | A | strongest subscription sequence backbone |
| `saas_subscription_churn` | `plan_tier`, `auto_renew_flag`, `signup_date`, `mrr_amount`, `usage_count`, `ticket`, `refund`, `satisfaction_score` | B | C, A | membership + support + billing 모두 강함 |
| `hillstrom` | `segment`, `visit`, `conversion`, `spend`, `history`, `recency` | C | A | action effect prior |
| `lenta` | `group`, `promo_share`, `discount`, `response_att`, `days_between_visits` | C | A | retail promo effect |
| `criteo` | `treatment`, `exposure`, `conversion`, `visit` | C | - | intervention-only prior |
| `orange_belgium_churn_uplift` | `y`, `t`, latent PC/factor columns | C | - | telecom intervention prior |
| `megafon` | `treatment_group`, `conversion` | C | - | synthetic intervention prior |
| `churn_modelling` | `Tenure`, `Balance`, `IsActiveMember` | B | A | banking baseline, core는 아님 |

## 최종 그룹핑 제안

### Branch A 핵심 데이터셋

- `retailrocket_raw`
- `retailrocket_processed`
- `olist`
- `x5`
- `ecommerce_customer_data`
- `churn_preprocessed`
- `ecommerce_company_client_churn_data`

Branch A 역할:

- 일반 구매 행동 감소
- order / payment / revenue / value drop
- inactivity 기반 churn degree

### Branch B 핵심 데이터셋

- `saas_subscription_churn`
- `kkbox_churn_prediction_challenge`
- `ibm_telco_customer_churn`
- `streaming_subscription_churn_model`
- `x5`
- `churn_preprocessed`
- `ecommerce_customer_data`

Branch B 역할:

- join -> active -> renewal -> expiry / churn lifecycle
- membership strength / lock-in / tenure
- subscription pressure

### Branch C 핵심 데이터셋

- `ecommerce_company_client_churn_data`
- `saas_subscription_churn`
- `olist`
- `churn_preprocessed`
- `hillstrom`
- `lenta`
- `criteo`
- `orange_belgium_churn_uplift`
- `megafon`
- `x5`

Branch C 역할:

- support / complaint / review / refund / trust deterioration
- treatment / promo / action effect
- intervention sensitivity

## Core vs Auxiliary

### Core datasets

이 프로젝트의 1차 core는 아래가 가장 적절하다.

- `retailrocket_raw`
- `saas_subscription_churn`
- `olist`
- `ecommerce_company_client_churn_data`

이유:

- `retailrocket_raw`: 일반 구매 행동 raw backbone
- `saas_subscription_churn`: membership / support / billing backbone
- `olist`: trust / delivery / review 보강
- `ecommerce_company_client_churn_data`: direct churn baseline + support/revenue snapshot

### Auxiliary datasets

- `kkbox_churn_prediction_challenge`
- `x5`
- `retailrocket_processed`
- `streaming_subscription_churn_model`
- `hillstrom`
- `lenta`
- `criteo`
- `orange_belgium_churn_uplift`
- `megafon`
- `ecommerce_customer_data`
- `churn_preprocessed`
- `ibm_telco_customer_churn`
- `churn_modelling`

역할:

- baseline sanity check
- subscription / loyalty 비교
- uplift prior calibration
- branch별 pretraining 또는 보조 실험

## 왜 이 방향이 맞는가

이 구조는 `쿠팡` 같은 복합 서비스 해석과 잘 맞는다.

- 일반 구매 행동: Branch A
- 멤버십 / 유지 관계: Branch B
- trust / CS / 프로모션 / 개입 효과: Branch C

즉 최종 churn power는 하나의 도메인에서만 나오지 않고,
아래 세 성분의 합성으로 볼 수 있다.

```text
churn_power
= commerce_activity_decay
+ membership_lifecycle_risk
+ trust_intervention_risk
```

마지막 MLP head는 이 세 성분을 합쳐 FE가 읽는 `churnRisk`로 바꾸는 역할을 한다.

## 다음 작업 순서

1. 각 core dataset에 대해 `entity_id`, `join_anchor`, `panel_unit` 정의
2. Branch A / B / C 별 공통 feature schema 초안 작성
3. leakage 없는 feature extraction rule 작성
4. direct `y` 와 derived `y` 정의
5. branch별 EDA
6. branch별 baseline training
7. 최종 churn power MLP head 설계

## 바로 다음에 보면 좋은 것

### Branch A에서 먼저 볼 것

- `retailrocket_raw`: visitor-month panel
- `olist`: customer-order panel
- `x5`: client purchase aggregation

### Branch B에서 먼저 볼 것

- `saas_subscription_churn`: account-month panel
- `kkbox`: member-billing-cycle panel

### Branch C에서 먼저 볼 것

- `ecommerce_company_client_churn_data`: support/revenue snapshot signal
- `olist`: review / delivery trust proxy
- `hillstrom`, `lenta`, `criteo`: action-effect prior
