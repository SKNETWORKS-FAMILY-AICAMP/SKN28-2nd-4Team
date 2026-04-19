# Branch C PRD: Trust / Support / Intervention Modeling

## 0. 문서 목적

본 문서는 `Trust / Support / Intervention branch` 를 정의한다.

이 브랜치는 아래 질문에 답하도록 설계한다.

1. support burden, complaint, review 악화가 얼마나 커졌는가
2. refund / escalation / delivery issue가 신뢰도에 어떤 영향을 주는가
3. 프로모션이나 treatment가 이탈 압력을 낮추는지, 오히려 높이는지 어떻게 반영할 것인가
4. 최종 `churn power` 에서 신뢰/개입 성분을 어떻게 공급할 것인가

---

## 1. 브랜치 역할과 justification

### 1.1 왜 이 브랜치가 필요한가

이 프로젝트는 단순 거래량만으로 설명되지 않는다.

실제 서비스에서 churn pressure가 커지는 대표 원인은 아래와 같다.

- 고객센터 접촉 증가
- 불만/컴플레인 발생
- 리뷰 악화
- 환불 증가
- 배송 지연 / 운영 이슈
- 프로모션 피로 또는 treatment 효과 저하

이 브랜치는 바로 이 **trust deterioration + intervention sensitivity** 를 담당한다.

### 1.2 왜 별도 브랜치로 분리하는가

- Branch A는 활동 감소를 본다.
- Branch B는 관계 구조를 본다.
- Branch C는 “왜 사용자가 감정적으로 또는 운영적으로 이탈할 수밖에 없는가”를 본다.

즉 이 브랜치는 다음 질문에 가깝다.

> “이 사용자는 지금 서비스에 대해 신뢰를 잃고 있는가?”

### 1.3 최종 목적과의 연결

Branch C는 최종 `churn power` 중 아래 성분을 담당한다.

```text
trust_intervention_risk
+ support_burden
+ promo_or_treatment_sensitivity
```

FE에서는 이 성분이 `trust_score`, `incident_pressure`, 일부 `churnRisk` 를 설명한다.

---

## 2. 브랜치에 포함할 데이터셋

### 2.1 핵심 데이터셋

| 데이터셋 | 채택 이유 | 역할 |
| --- | --- | --- |
| `ecommerce_company_client_churn_data` | `cs_tickets_*`, `csat`, feedback 존재 | direct support/trust anchor |
| `saas_subscription_churn` | support ticket, refund, escalation, satisfaction 존재 | service trust backbone |
| `olist` | review / delivery / order status 존재 | trust + fulfillment proxy |
| `churn_preprocessed` | `Complain`, `SatisfactionScore` 존재 | compact trust baseline |

### 2.2 intervention prior 데이터셋

| 데이터셋 | 역할 |
| --- | --- |
| `hillstrom` | treatment-response 해석 |
| `lenta` | promo response / discount sensitivity |
| `criteo` | exposure / treatment / conversion |
| `orange_belgium_churn_uplift` | anonymized telecom intervention prior |
| `megafon` | synthetic uplift sanity check |
| `x5` | points / treatment / loyalty response |

---

## 3. 데이터 표현 원칙

### 3.1 기본 단위

```text
한 행 = 특정 사용자(entity)의 특정 시점까지 관측 가능한 trust / support / intervention 관련 상태 요약
```

### 3.2 panel unit

- 기본: month
- review / support volume가 높으면 week 가능

### 3.3 leakage 방지 원칙

직접 쓰지 않는 것:

- 예측 시점 이후 리뷰 / 환불 / 응답 결과
- future promo exposure 결과
- target 이후 집계된 review score 평균

직접 쓰는 것:

- `support_ticket_count_30d`
- `complaint_flag_30d`
- `review_score_mean_90d`
- `delivery_delay_mean_30d`
- `refund_amount_30d`
- `promo_exposure_count_30d`

---

## 4. Feature Name Normalization Schema

### 4.1 핵심 canonical features

| canonical feature | 의미 | 타입 | 예시 원천 컬럼 |
| --- | --- | --- | --- |
| `support_ticket_count_30d` | 최근 지원 요청 수 | numeric | `cs_tickets_*`, `ticket_id` aggregation |
| `support_ticket_count_90d` | 최근 90일 지원 요청 수 | numeric | support aggregation |
| `complaint_flag_30d` | 최근 complaint 존재 여부 | binary | `Complain`, complaint tickets |
| `complaint_count_90d` | 최근 complaint 횟수 | numeric | complaint aggregation |
| `csat_last` | 최근 만족도 | numeric | `csat`, `satisfaction_score`, `SatisfactionScore` |
| `review_score_mean_90d` | 최근 리뷰 평균 | numeric | `review_score` |
| `low_review_ratio_90d` | 저평점 비율 | numeric | derived from review_score |
| `refund_amount_90d` | 최근 환불 금액 | numeric | `refund_amount_usd` |
| `escalation_count_90d` | 최근 escalation 건수 | numeric | `escalation_flag` |
| `first_response_minutes_mean_30d` | 첫 응답 지연 평균 | numeric | `first_response_time_minutes` |
| `resolution_hours_mean_30d` | 해결 지연 평균 | numeric | `resolution_time_hours` |
| `delivery_delay_mean_30d` | 배송 지연 평균 | numeric | delivered vs estimated date |
| `discount_usage_rate_30d` | 할인 사용 강도 | numeric | `Discount_Usage`, discount share |
| `coupon_usage_count_30d` | 쿠폰 사용량 | numeric | `CouponUsed` |
| `cashback_amount_30d` | 캐시백 관련 금액 | numeric | `CashbackAmount` |
| `points_received_30d` | 적립 포인트 | numeric | `regular_points_received`, `express_points_received` |
| `points_spent_30d` | 사용 포인트 | numeric | `regular_points_spent`, `express_points_spent` |
| `treatment_flag` | 개입 여부 | binary | `treatment`, `group`, `segment`, `t` |
| `promo_exposure_count_30d` | 최근 프로모션 노출 횟수 | numeric | exposure / promo aggregation |
| `response_flag` | 개입 후 반응 여부 | binary | `response_att`, `conversion`, `visit`, `y` |
| `trust_damage_proxy` | 신뢰 손상 종합 점수 | numeric | review / refund / complaint / support 조합 |

### 4.2 정규화 규칙

| 규칙 | 내용 |
| --- | --- |
| review / csat | 방향을 통일해 낮을수록 위험 증가로 변환 |
| refund / ticket count | `log1p` 후보 |
| treatment 계열 | binary or categorical code |
| response 계열 | target으로도 쓰고 prior signal로도 분리 사용 |
| delivery delay | `actual - estimated` 차이로 계산 |

---

## 5. 데이터셋별 처리 방식

| 데이터셋 | entity_id | join anchor | panel unit | 주로 추출할 canonical feature | y_class | y_reg | 비고 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ecommerce_company_client_churn_data` | `user_id` | `user_creation_datetime` | snapshot / month-like | `support_ticket_count_*`, `csat_last`, `complaint_count_90d` proxy | `status` | `churn_factor` | primary anchor |
| `saas_subscription_churn` | `account_id` | `signup_date` | month | `support_ticket_count_30d`, `refund_amount_90d`, `escalation_count_90d`, `csat_last` | `churn_flag` | `resolution_hours_mean_30d`, `refund_amount_90d` | primary backbone |
| `olist` | `customer_unique_id` | first order | month | `review_score_mean_90d`, `low_review_ratio_90d`, `delivery_delay_mean_30d` | `low_review_risk`, `no_repurchase_next_90d` | `delivery_delay_days` | trust proxy |
| `churn_preprocessed` | `CustomerID` | implicit | snapshot | `complaint_flag_30d`, `csat_last` proxy, `coupon_usage_count_30d` | `Churn` | 없음 | compact baseline |
| `hillstrom` | customer row | campaign pre-window | experiment row | `treatment_flag`, `response_flag`, `history`, `recency` | `visit`, `conversion` | `spend` | intervention prior |
| `lenta` | customer row | campaign pre-window | windowed summary | `discount_usage_rate_30d`, `treatment_flag`, `response_flag` | `response_att` | optional response value proxy | promo prior |
| `criteo` | impression/user row | experiment row | snapshot | `treatment_flag`, `promo_exposure_count_30d` proxy, `response_flag` | `conversion`, `visit` | 없음 | exposure prior |
| `orange_belgium_churn_uplift` | customer row | experiment row | snapshot | latent features + `treatment_flag` | `y` | 없음 | anonymized prior |
| `megafon` | synthetic row | experiment row | snapshot | latent features + `treatment_flag` | `conversion` | 없음 | sanity prior |
| `x5` | `client_id` | `first_issue_date` | month | `points_received_30d`, `points_spent_30d`, `treatment_flag` | `target` | future spend proxy | loyalty/action bridge |

---

## 6. Branch C 모델 방향

### 6.1 추천 구조

- 입력: Branch C canonical feature table
- 전처리:
  - 방향 통일 (`높은 만족도 = 낮은 위험` 등)
  - ticket/refund/log counts `log1p`
  - treatment / promo / response 분리 인코딩
- 모델:
  - **1차 baseline**: LightGBM / CatBoost / uplift baseline
  - **브랜치 extractor 본선**: tabular MLP encoder + optional treatment-aware auxiliary heads

### 6.2 왜 MLP encoder가 맞는가

- support / review / promo feature는 heterogeneous numeric/categorical mix다.
- treatment-aware interaction은 선형 결합보다 비선형 관계가 많다.
- branch output을 embedding으로 만들면 final ensemble head에서 다루기 쉽다.

### 6.3 출력

- `z_c`: 16~64차원 embedding
- `trust_damage_score`
- `intervention_sensitivity_score`
- optional auxiliary predictions
  - `low_review_risk`
  - `response_flag`
  - `refund_risk`

---

## 7. 주된 목적과의 연결

Branch C는 프로젝트의 “서비스를 싫어하게 되는 이유”를 설명한다.

이 브랜치가 강하게 잡아야 하는 의미는 다음이다.

- support / complaint가 누적되면 trust가 깎인다.
- 리뷰 / 배송 / 환불 문제는 activity 감소보다 먼저 경고로 나타날 수 있다.
- intervention이 효과가 있는 사용자와 없는 사용자를 구분해야 action layer도 설계할 수 있다.

따라서 Branch C는 아래 질문에 답해야 한다.

> “이 사용자는 서비스에 대한 신뢰 손상 때문에 이탈 압력이 커지고 있는가, 그리고 개입이 먹힐 가능성이 있는가?”
