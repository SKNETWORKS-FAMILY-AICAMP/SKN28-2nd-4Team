# saas_subscription_churn

## 1. 예측 태스크

- 기본 태스크: **binary classification**
- 직접 제공되는 `y` 후보:
  - `ravenstack_accounts.csv`의 `churn_flag`
  - `ravenstack_subscriptions.csv`의 `churn_flag`
- 보조 태스크:
  - **regression**: `mrr_amount`, `arr_amount`, `refund_amount_usd`, `resolution_time_hours`
- 한 줄 해석: B2B SaaS 고객 계정 / 구독 / usage / support / churn event를 분리해 둔 synthetic multi-table churn 데이터셋이다.

## 2. 전체 컬럼

### `ravenstack_accounts.csv`

```text
account_id
account_name
industry
country
signup_date
referral_source
plan_tier
seats
is_trial
churn_flag
```

### `ravenstack_churn_events.csv`

```text
churn_event_id
account_id
churn_date
reason_code
refund_amount_usd
preceding_upgrade_flag
preceding_downgrade_flag
is_reactivation
feedback_text
```

### `ravenstack_feature_usage.csv`

```text
usage_id
subscription_id
usage_date
feature_name
usage_count
usage_duration_secs
error_count
is_beta_feature
```

### `ravenstack_subscriptions.csv`

```text
subscription_id
account_id
start_date
end_date
plan_tier
seats
mrr_amount
arr_amount
is_trial
upgrade_flag
downgrade_flag
churn_flag
billing_frequency
auto_renew_flag
```

### `ravenstack_support_tickets.csv`

```text
ticket_id
account_id
submitted_at
closed_at
resolution_time_hours
priority
first_response_time_minutes
satisfaction_score
escalation_flag
```

## 3. 데이터셋 메타데이터

- 데이터 성격: **synthetic SaaS multi-table dataset**다.
- 실제 SaaS 운영 구조를 닮게 만든 생성형 데이터셋으로 이해하면 된다.
- 도메인: **B2B SaaS subscription service**
- 비즈니스 모델 관점:
  - 계정이 구독을 유지하고 좌석 수와 요금제를 변경한다.
  - feature usage, support ticket, churn reason, refund가 함께 제공되어 실제 운영 KPI를 흉내 낸다.

## 4. 컨텍스트

- 시간축: **명시적인 날짜/시간 컬럼이 들어 있는 multi-table sequence 데이터**다.
- 확인된 대표 시간 범위:
  - `accounts.signup_date`: 2023-01-02 ~ 2024-12-31
  - `subscriptions.start_date`: 2023-01-09 ~ 2024-12-31
  - `feature_usage.usage_date`: 2023-01-01 ~ 2024-12-31
  - `support_tickets.submitted_at`: 2023-01-02 ~ 2024-12-31
  - `churn_events.churn_date`: 2023-01-25 ~ 2024-12-31
- 따라서 account timeline을 기준으로 join / aggregate를 설계하기 좋다.

## 5. 결론: 데이터 representation

- representation 단위:
  - raw level: 계정 / 구독 / 사용 / 문의 / churn event 분리
  - modeling level: **한 행 = 한 account의 일정 시점 상태 요약**
- 추천 `X`:
  - 계정 기본정보 (`industry`, `country`, `plan_tier`, `seats`)
  - subscription 상태 (`mrr_amount`, `arr_amount`, `billing_frequency`, `auto_renew_flag`)
  - usage 집계 (`usage_count`, `usage_duration_secs`, `error_count`)
  - support 집계 (`resolution_time_hours`, `first_response_time_minutes`, `satisfaction_score`, `escalation_flag`)
- 추천 `y`: `churn_flag`
- 비즈니스 도메인 해석:
  - 사용량 저하, 지원 이슈, 요금제 변경, refund 징후를 바탕으로
  - 고객 계정이 SaaS를 이탈할지 분류하는 구조다.
  - 프로젝트에서는 SaaS 도메인의 **state variable / incident pressure / trust proxy**를 실험하기 좋다.
