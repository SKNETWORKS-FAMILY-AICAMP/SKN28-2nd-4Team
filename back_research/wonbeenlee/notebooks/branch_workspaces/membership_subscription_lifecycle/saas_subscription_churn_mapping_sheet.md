# saas_subscription_churn Mapping Sheet

## 0. 목적

이 문서는 `saas_subscription_churn` 을 Branch B 학습 데이터로 옮기기 위한
실제 column-to-canonical mapping 기준표다.

주의:

- 이 문서는 raw schema 확인 이전의 가정 문서가 아니다.
- `01_saas_raw_inventory_and_column_selection.ipynb` 에서 실제 raw loading과 column inventory를 본 뒤,
  그 결과를 mapping 형태로 압축한 downstream 기준표로 사용한다.
- 즉 source of truth는 raw inventory notebook이고, 이 문서는 그 결과 정리본이다.

이 데이터셋의 역할:

- Branch B core backbone
- full supervision dataset
- `lifecycle_risk` 와 `lockin_decay` 를 가장 먼저 정의할 기준셋
- Branch B v1 단일 데이터셋 실험 기준셋

---

## 1. source tables

- `ravenstack_accounts.csv`
- `ravenstack_subscriptions.csv`
- `ravenstack_feature_usage.csv`
- `ravenstack_support_tickets.csv`
- `ravenstack_churn_events.csv`

---

## 2. panel row 정의

| 항목 | 값 |
| --- | --- |
| `dataset_id` | `saas_subscription_churn` |
| `entity_id` | `account_id` |
| `join_anchor_date` | `signup_date` |
| `panel_unit` | `month` |
| `as_of_date` | month-end |
| observation window | 최근 90일 |
| horizon | 다음 30일 또는 다음 billing cycle |
| tier | `core` |

한 row의 의미:

```text
한 account가 특정 month-end 시점까지 보여준
subscription / renewal / usage / support 상태 요약
```

---

## 3. Branch B canonical mapping

| canonical feature | source table | source column | derivation |
| --- | --- | --- | --- |
| `b_days_since_join` | `accounts` | `signup_date` | `as_of_date - signup_date` |
| `b_tenure_days` | `accounts` | `signup_date` | `as_of_date - signup_date` |
| `b_subscription_plan_code` | `subscriptions` | `plan_tier` | 현재 active subscription의 `plan_tier` |
| `b_auto_renew_flag` | `subscriptions` | `auto_renew_flag` | 현재 active subscription 기준 |
| `b_days_to_expiry` | `subscriptions` | `end_date` | `end_date - as_of_date` |
| `b_cancel_flag_30d` | `churn_events` | `churn_date` | 최근 30일 churn event 존재 여부 |
| `b_renewal_failure_count_90d` | `subscriptions`, `churn_events` | `end_date`, `start_date`, `churn_date` | renewal due 이후 follow-on subscription 부재 횟수 파생 |
| `b_plan_change_up_flag_90d` | `subscriptions`, `churn_events` | `upgrade_flag`, `preceding_upgrade_flag` | 최근 90일 상향 변경 여부 |
| `b_plan_change_down_flag_90d` | `subscriptions`, `churn_events` | `downgrade_flag`, `preceding_downgrade_flag` | 최근 90일 하향 변경 여부 |
| `b_usage_intensity_30d` | `feature_usage` | `usage_count`, `usage_duration_secs` | 최근 30일 usage 집계 |
| `b_usage_drop_ratio_30d_vs_prev_30d` | `feature_usage` | `usage_count`, `usage_duration_secs` | 최근 30일 vs 이전 30일 사용량 감소율 |
| `b_loyalty_benefit_use_30d` | 없음 | 없음 | 생성하지 않음 |

보조로 함께 볼 컬럼:

- `billing_frequency`
- `mrr_amount`
- `arr_amount`
- `seats`
- `is_trial`

이 값들은 직접 canonical feature가 아니어도
plan signature와 value loss target 정의에 필요하다.

---

## 4. Branch B supervision target

| target | source | 정의 |
| --- | --- | --- |
| `target_b_churn_like_event` | `churn_events`, `subscriptions` | 다음 30일 churn event 또는 유지 실패 발생 |
| `target_b_non_renewal` | `subscriptions`, `churn_events` | renewal due 이후 follow-on subscription 부재 |
| `target_b_days_to_failure` | `churn_events` | `churn_date - as_of_date` |
| `target_b_value_loss` | `subscriptions` | 다음 30일 `mrr_amount` 감소량 |
| `target_b_lifecycle_risk` | future churn/non-renewal/usage/value change | 미래 horizon 기준 lifecycle 붕괴 강도 |
| `target_b_lockin_decay` | future renew/expiry/plan/usage change | 미래 horizon 기준 lock-in 약화 강도 |

`target_b_lifecycle_risk` 권장 조합:

```text
45 * churn_like_event_future
+ 25 * non_renewal_future
+ 20 * usage_drop_ratio_future
+ 10 * value_loss_ratio_future
```

`target_b_lockin_decay` 권장 조합:

```text
35 * auto_renew_off_or_fail_future
+ 25 * expiry_without_renewal_future
+ 20 * plan_downgrade_future
+ 10 * usage_consistency_break_future
+ 10 * seat_or_value_contraction_future
```

---

## 5. notebook에서 지금 하는 일

이 데이터셋에서 우리가 지금 수행해야 하는 일은 아래 순서다.

1. raw source file 존재 여부 확인
2. account 기준 join key 정리
3. month-end `as_of_date` 생성 규칙 확정
4. 최근 30일 / 90일 aggregate 정의
5. 미래 30일 target 생성 규칙 확정
6. `branch_b_train_core` 용 row export contract 고정

즉 현재 단계는 모델 학습이 아니라,
`future leakage 없이 Branch B supervision row를 만드는 단계` 다.

---

## 6. immediate checks

- 동일 account에 여러 subscription이 겹치는지 확인
- `end_date < start_date` 같은 비정상 레코드 확인
- usage 없는 account를 `0 usage` 로 볼지 `missing` 으로 볼지 결정
- churn event가 subscription 종료와 항상 일치하는지 확인
- `mrr_amount` 와 `arr_amount` 의 동시성 확인

---

## 7. output 기대값

이 mapping sheet 이후 산출물:

- `saas_branch_b_panel.parquet`
- `saas_branch_b_train.parquet`
- `saas_branch_b_target_spec.md` 또는 notebook cell

이 세 개가 준비되면,
`saas_subscription_churn` 단일 데이터셋 기준 Branch B v1 학습 세트로 바로 쓸 수 있다.
