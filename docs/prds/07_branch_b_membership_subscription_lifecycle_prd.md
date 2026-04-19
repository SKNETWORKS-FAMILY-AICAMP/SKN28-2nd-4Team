# Branch B PRD: Membership / Subscription / Lifecycle Modeling

## 0. 문서 목적

본 문서는 `Membership / Subscription / Lifecycle branch` 를 정의한다.

이 브랜치는 아래 질문에 답하도록 설계한다.

1. 가입 관계가 얼마나 오래 유지되고 있는가
2. 갱신 / 만료 / 취소 압력이 커지고 있는가
3. 사용량 감소가 membership churn으로 이어질 가능성이 있는가
4. lock-in 구조를 어떤 feature로 잡아낼 것인가

---

## 1. 브랜치 역할과 justification

### 1.1 왜 이 브랜치가 필요한가

프로젝트의 메인 메시지는 churn prediction이 아니라 **retention strategy simulator** 이다.

이때 membership / subscription 구조는 아래 이유로 중요하다.

- 장기 계약 / 자동 갱신 / 만료 구조가 lock-in을 만든다.
- 일반 구매 감소와 다르게, 구독 해지는 더 직접적으로 `retention_score` 와 연결된다.
- `쿠팡 와우` 같은 복합 서비스도 결국 membership lifecycle 해석이 필요하다.

### 1.2 왜 별도 브랜치로 분리하는가

- Branch A가 “구매 감소”를 본다면,
- Branch B는 “관계 유지 구조 자체의 붕괴”를 본다.

같은 churn이라도 아래는 다른 현상이다.

- 구매 빈도는 줄었지만 membership은 유지 중
- 사용량은 유지되지만 renew 실패 위험이 증가
- plan downgrade / cancel / expiry가 누적되는 중

이 차이를 별도 representation으로 분리해야 최종 `churn power` 가 해석 가능해진다.

### 1.3 최종 목적과의 연결

Branch B는 최종 `churn power` 중 아래 성분을 담당한다.

```text
membership_lifecycle_risk
+ lock_in_decay
```

즉 FE의 `lock_in_score`, `retention_score` 와 가장 직접적으로 연결되는 브랜치다.

---

## 2. 브랜치에 포함할 데이터셋

### 2.1 핵심 데이터셋

| 데이터셋 | 채택 이유 | 역할 |
| --- | --- | --- |
| `saas_subscription_churn` | signup, subscription, usage, support, churn_date가 함께 존재 | primary membership backbone |
| `kkbox_churn_prediction_challenge` | registration, payment, renew, cancel, usage sequence 모두 존재 | strongest subscription sequence reference |
| `ibm_telco_customer_churn` | contract / tenure / charges 구조가 명확 | clean baseline |
| `streaming_subscription_churn_model` | subscription_type + usage intensity 조합 제공 | lighter subscription benchmark |

### 2.2 bridge / 보조 데이터셋

| 데이터셋 | 역할 |
| --- | --- |
| `x5` | loyalty issue / redeem 를 membership-like 신호로 사용 |
| `ecommerce_customer_data` | `Membership_Years` 보조 baseline |
| `churn_preprocessed` | `Tenure` / device / order relation 보조 baseline |

---

## 3. 데이터 표현 원칙

### 3.1 기본 단위

```text
한 행 = 특정 사용자(entity)의 특정 시점까지 관측 가능한 membership / contract / renewal 상태 요약
```

### 3.2 권장 panel unit

- 기본 단위: **month**
- subscription billing data가 강한 경우: **billing cycle**

### 3.3 leakage 방지 원칙

직접 쓰지 않는 것:

- 예측 시점 이후 갱신 결과
- 미래 시점이 반영된 `end_date`
- target horizon 이후의 usage 집계

직접 쓰는 것:

- `days_since_join`
- `days_to_expiry`
- `renewal_due_in_30d`
- `usage_drop_ratio_30d_vs_prev_30d`
- `pause_count_90d`

---

## 4. Feature Name Normalization Schema

### 4.1 핵심 canonical features

| canonical feature | 의미 | 타입 | 예시 원천 컬럼 |
| --- | --- | --- | --- |
| `days_since_join` | 가입 이후 경과일 | numeric | `signup_date`, `registration_init_time`, `first_issue_date`, `Tenure` |
| `tenure_days` | 관계 지속 기간 | numeric | `tenure`, `Tenure`, `days_since_join` |
| `subscription_plan_code` | 요금제 / 플랜 수준 | categorical | `plan_tier`, `subscription_type`, `payment_plan`, `Contract` |
| `billing_amount_current` | 현재 청구 금액 | numeric | `mrr_amount`, `actual_amount_paid`, `MonthlyCharges`, `plan_list_price` |
| `billing_amount_mean_90d` | 최근 90일 평균 과금 | numeric | transactions / subscriptions aggregation |
| `billing_amount_drop_ratio_30d_vs_prev_30d` | 과금 감소율 | numeric | rolling billing compare |
| `auto_renew_flag` | 자동 갱신 여부 | binary | `auto_renew_flag`, `is_auto_renew` |
| `cancel_flag_30d` | 최근 취소 여부 | binary | `is_cancel`, churn/cancel event |
| `days_to_expiry` | 만료까지 남은 일수 | numeric | `membership_expire_date`, `end_date` |
| `renewal_failure_count_90d` | 최근 갱신 실패 / 비갱신 횟수 | numeric | derived from billing cycles |
| `plan_change_up_flag_90d` | 최근 업그레이드 여부 | binary | `upgrade_flag`, `preceding_upgrade_flag` |
| `plan_change_down_flag_90d` | 최근 다운그레이드 여부 | binary | `downgrade_flag`, `preceding_downgrade_flag` |
| `subscription_pause_count_90d` | 구독 일시정지 횟수 | numeric | `num_subscription_pauses` |
| `usage_intensity_30d` | 최근 사용 강도 | numeric | `usage_count`, `weekly_hours`, `total_secs` |
| `active_usage_days_30d` | 최근 활동일 수 | numeric | usage date distinct count |
| `usage_drop_ratio_30d_vs_prev_30d` | 사용 감소율 | numeric | rolling usage compare |
| `device_count_current` | 등록/사용 디바이스 수 | numeric | `NumberOfDeviceRegistered` |
| `loyalty_benefit_use_30d` | 멤버십 혜택 사용 수준 | numeric | `regular_points_spent`, `express_points_spent` |
| `loyalty_issue_age_days` | loyalty 발급 이후 경과일 | numeric | `first_issue_date` |
| `redeem_delay_days` | 발급 후 첫 사용까지 지연 | numeric | `first_issue_date`, `first_redeem_date` |

### 4.2 정규화 규칙

| 규칙 | 내용 |
| --- | --- |
| duration 계열 | day 단위로 통일 |
| amount 계열 | currency 단위는 표준화 전 로그/비율 고려 |
| categorical plan | integer code 또는 embedding input 으로 변환 |
| renewal / cancel flag | 최근 horizon 기준 파생 |
| usage 계열 | 7d / 30d / 90d rolling으로 통일 |

---

## 5. 데이터셋별 처리 방식

| 데이터셋 | entity_id | join anchor | panel unit | 주로 추출할 canonical feature | y_class | y_reg | 비고 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `saas_subscription_churn` | `account_id` | `signup_date` | month | `days_since_join`, `billing_amount_current`, `auto_renew_flag`, `usage_intensity_30d`, `plan_change_*` | `churn_flag` | `days_until_churn`, `next_30d_mrr_loss` | primary backbone |
| `kkbox_churn_prediction_challenge` | `msno` | `registration_init_time` | billing cycle / month | `days_since_join`, `days_to_expiry`, `auto_renew_flag`, `cancel_flag_30d`, `usage_intensity_30d` | `is_churn` | `days_until_churn` proxy | sequence reference |
| `ibm_telco_customer_churn` | `customerID` | implicit | snapshot | `tenure_days`, `subscription_plan_code`, `billing_amount_current`, `contract_term_proxy` | `Churn` | optional `TotalCharges` style value regression | baseline |
| `streaming_subscription_churn_model` | `customer_id` | relative `signup_date` | snapshot / pseudo-month | `subscription_plan_code`, `subscription_pause_count_90d`, `usage_intensity_30d`, `usage_drop_ratio_*` | `churned` | usage drop proxy | lighter benchmark |
| `x5` | `client_id` | `first_issue_date` | month | `loyalty_issue_age_days`, `redeem_delay_days`, `loyalty_benefit_use_30d` | `target` | future spend proxy | bridge |
| `churn_preprocessed` | `CustomerID` | implicit | snapshot | `tenure_days`, `device_count_current` | `Churn` | 없음 | aux |
| `ecommerce_customer_data` | `Customer_ID` | implicit | snapshot | `Membership_Years` -> `tenure_days` 변환 | `Churn` | 없음 | aux |

---

## 6. Branch B 모델 방향

### 6.1 추천 구조

- 입력: Branch B canonical feature table
- 전처리:
  - duration/amount scaling
  - categorical embedding (`plan`, `contract`, `billing_frequency`)
  - rolling usage / renewal feature 생성
- 모델:
  - **1차 baseline**: CatBoost / LightGBM
  - **브랜치 extractor 본선**: tabular MLP encoder with categorical embeddings

### 6.2 왜 MLP encoder가 맞는가

- membership / billing / usage feature는 범주형과 수치형이 섞여 있다.
- categorical embedding을 붙인 MLP가 shared latent space를 만들기 좋다.
- `kkbox`, `saas`, `telco`를 같은 branch schema로 흡수하기 쉽다.
- 시계열 raw 길이를 직접 맞추기보다, billing-cycle panel로 정리한 뒤 dense encoder로 가는 편이 현실적이다.

### 6.3 출력

- `z_b`: 16~64차원 embedding
- `lifecycle_risk_score`
- `lock_in_decay_score`
- optional auxiliary predictions
  - `non_renewal_next_cycle`
  - `churn_next_30d`
  - `days_until_churn`

---

## 7. 주된 목적과의 연결

Branch B는 프로젝트의 “멤버십 유지 구조가 실제로 얼마나 버티는가”를 설명하는 브랜치다.

이 브랜치가 강하게 잡아야 하는 의미는 다음이다.

- 구매는 유지돼도 membership은 이미 붕괴 직전일 수 있다.
- 반대로 구매는 약해져도 auto-renew / contract 때문에 lock-in이 남아 있을 수 있다.
- 따라서 Branch B가 없으면 FE의 `lock_in_score` 와 `retention_score` 가 비어 보이게 된다.

따라서 Branch B는 아래 질문에 답해야 한다.

> “이 사용자는 관계 자체가 유지되는 상태인가, 아니면 다음 갱신/만료에서 무너질 가능성이 큰가?”
