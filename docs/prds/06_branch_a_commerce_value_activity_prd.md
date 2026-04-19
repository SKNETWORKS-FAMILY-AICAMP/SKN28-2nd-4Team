# Branch A PRD: Commerce / Value / Activity Modeling

## 0. 문서 목적

본 문서는 최종 `churn power` 모델의 첫 번째 브랜치인 `Commerce / Value / Activity branch` 를 정의한다.

이 브랜치는 아래 질문에 답하도록 설계한다.

1. 사용자의 구매/주문/세션 활동이 약해지고 있는가
2. 활동 감소가 단순 fluctuation 이 아니라 이탈 전조인가
3. 사용 가치(`value`)가 얼마나 빠르게 감소하는가
4. 이 신호를 최종 `churn power` 에 어떤 방식으로 공급할 것인가

---

## 1. 브랜치 역할과 justification

### 1.1 왜 이 브랜치가 필요한가

프로젝트의 FE는 단순 이탈 여부가 아니라 월별 `churnRisk`, 예상 사용자 감소, 유지율 변화를 보여준다.

이때 가장 먼저 감지되는 신호는 보통 아래와 같다.

- 구매 빈도 감소
- 활동일 감소
- 장바구니/조회 대비 구매 전환 감소
- spend / revenue 감소
- repeat purchase gap 확대

이 브랜치는 바로 이 **행동 감소와 가치 감소** 를 읽는 역할을 맡는다.

### 1.2 왜 별도 브랜치로 분리하는가

이 신호군은 다음과 같은 특징이 있다.

- `retailrocket_raw`, `olist`, `x5` 처럼 거래/행동 중심 데이터셋에서 강하게 드러난다.
- `saas` 나 `subscription` 브랜치와 비교하면, 계약/갱신보다 **실사용과 구매 intensity** 가 중심이다.
- 따라서 membership / trust 신호와 섞기 전에 독립 representation 으로 먼저 추출하는 것이 해석상 유리하다.

### 1.3 최종 목적과의 연결

이 브랜치는 최종 `churn power` 중 아래 성분을 담당한다.

```text
commerce_activity_decay
+ value_drop_signal
```

즉 FE에서 보이는 위험도 상승의 상당 부분은,
이 브랜치가 만들어내는 **활동 감소 / 가치 하락** 신호에서 나온다.

---

## 2. 브랜치에 포함할 데이터셋

### 2.1 핵심 데이터셋

| 데이터셋 | 채택 이유 | 역할 |
| --- | --- | --- |
| `retailrocket_raw` | raw event 기반 활동 감소를 직접 볼 수 있음 | primary raw backbone |
| `olist` | order / payment / freight / review를 통해 구매 경험과 가치 하락을 볼 수 있음 | commerce + trust bridge |
| `x5` | loyalty가 섞인 retail 구매 이력 제공 | commerce-membership bridge |
| `retailrocket_processed` | 가공 feature로 빠른 sanity baseline 가능 | engineered benchmark |
| `ecommerce_company_client_churn_data` | recency / revenue / sales snapshot이 직접 존재 | supervised anchor |

### 2.2 보조 데이터셋

| 데이터셋 | 역할 |
| --- | --- |
| `ecommerce_customer_data` | 단순 e-commerce churn baseline |
| `churn_preprocessed` | preprocessed e-commerce churn baseline |
| `streaming_subscription_churn_model` | usage intensity 신호 보조 |

---

## 3. 데이터 표현 원칙

### 3.1 기본 단위

Branch A는 raw row를 직접 먹지 않는다.

반드시 아래 단위로 바꾼다.

- `entity_id`
- `as_of_date`
- `panel_window`

즉 최종 입력 단위는 아래와 같다.

```text
한 행 = 특정 사용자(entity)의 특정 시점(as-of date)까지 관측 가능한 상거래 / 활동 요약
```

### 3.2 권장 panel unit

- 기본 단위: **month**
- 보조 단위:
  - 거래 밀도가 매우 높은 경우 `week`
  - 데이터셋이 이미 rolling window 요약이면 기존 window 구조 유지

### 3.3 leakage 방지 원칙

직접 쓰지 않는 것:

- 예측 시점 이후 주문/결제 정보
- 전체 기간을 본 뒤 계산한 last purchase 기반 집계
- future revenue를 feature에 누출하는 target-adjacent 변수

직접 쓰는 것:

- `days_since_last_activity`
- `purchase_count_last_30d`
- `spend_last_90d`
- `activity_drop_ratio_30d_vs_prev_30d`

---

## 4. Feature Name Normalization Schema

Branch A는 데이터셋마다 컬럼명이 다르기 때문에, 먼저 canonical feature name으로 정규화해야 한다.

### 4.1 핵심 canonical features

| canonical feature | 의미 | 타입 | 예시 원천 컬럼 |
| --- | --- | --- | --- |
| `days_since_join` | 최초 가입/첫 활동 이후 경과일 | numeric | `first_purchase_datetime`, `first_issue_date`, first event timestamp |
| `days_since_last_activity` | 마지막 활동 이후 경과일 | numeric | `timestamp`, `order_purchase_timestamp`, `last_purchase_datetime` |
| `days_since_last_purchase` | 마지막 구매 이후 경과일 | numeric | `transactionid`, `order_purchase_timestamp`, `transaction_datetime` |
| `session_count_30d` | 최근 30일 세션 수 | numeric | `session_*`, raw event aggregation |
| `view_count_30d` | 최근 30일 조회 수 | numeric | `events.event=view`, `view_count_*` |
| `cart_count_30d` | 최근 30일 장바구니 수 | numeric | `events.event=addtocart`, `cart_count_*` |
| `purchase_count_30d` | 최근 30일 구매 수 | numeric | `transactionid`, `purchase_count_*`, order aggregation |
| `purchase_sum_30d` | 최근 30일 구매 금액 | numeric | `payment_value`, `purchase_sum`, `target_revenue` 관련 집계 |
| `purchase_sum_90d` | 최근 90일 구매 금액 | numeric | `sale_sum_*`, `historic_revenue_eur` 변환 |
| `avg_order_value_90d` | 평균 주문 가치 | numeric | `aov`, `payment_value/order_count`, `month_average_order_value` |
| `order_count_30d` | 최근 30일 주문 수 | numeric | `order_id` count, `OrderCount` |
| `basket_size_mean_90d` | 평균 주문당 수량 | numeric | `product_quantity`, `order_item_id` count |
| `category_diversity_90d` | 상품군 다양성 | numeric | category/product aggregation |
| `product_diversity_90d` | distinct product 수 | numeric | `product_id`, `itemid` |
| `conversion_view_to_cart_30d` | 조회 대비 장바구니 전환 | numeric | raw event counts |
| `conversion_cart_to_purchase_30d` | 장바구니 대비 구매 전환 | numeric | raw event counts |
| `activity_drop_ratio_30d_vs_prev_30d` | 활동 감소율 | numeric | rolling counts 비교 |
| `spend_drop_ratio_30d_vs_prev_30d` | spend 감소율 | numeric | rolling revenue 비교 |
| `repeat_purchase_gap_days` | 반복 구매 간격 | numeric | order / transaction datetime gap |
| `value_score_proxy` | 구매 가치 종합 점수 | numeric | spend / aov / order count 조합 |

### 4.2 정규화 규칙

| 규칙 | 내용 |
| --- | --- |
| count 계열 | `log1p` 후보로 본다 |
| 금액 계열 | currency 단위 차이가 있으면 z-score 전에 ratio / percentile 검토 |
| recency 계열 | 길수록 위험이 커지도록 방향을 맞춘다 |
| ratio 계열 | `[-1, 1]` 또는 `[0, 1]` 로 clip |
| sparse raw event | panel aggregation 후 투입 |

---

## 5. 데이터셋별 처리 방식

| 데이터셋 | entity_id | join anchor | panel unit | 주로 추출할 canonical feature | y_class | y_reg | 비고 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `retailrocket_raw` | `visitorid` | first event timestamp | month | `view_count_30d`, `cart_count_30d`, `purchase_count_30d`, `days_since_last_activity`, `conversion_*` | `inactive_next_30d`, `next_30d_purchase_flag` | `next_30d_revenue` | raw backbone |
| `retailrocket_processed` | `user_id` | 이미 가공됨 | existing time step | `session_count_*`, `purchase_*`, `customer_value_*`, `target_event`와 분리된 input feature | `target_event` | `target_revenue`, `target_customer_value`, `target_actual_profit` | 빠른 baseline |
| `olist` | `customer_unique_id` | first `order_purchase_timestamp` | month | `order_count_30d`, `purchase_sum_30d`, `avg_order_value_90d`, `days_since_last_purchase`, `product_diversity_90d` | `no_repurchase_next_90d` | `next_90d_spend`, `delivery_delay_days` | review는 Branch C에도 공유 |
| `x5` | `client_id` | `first_issue_date` 또는 first purchase | month | `purchase_sum_30d`, `purchase_count_30d`, `basket_size_mean_90d`, `days_since_last_purchase`, `value_score_proxy` | `target` | `next_30d_purchase_sum` | loyalty bridge |
| `ecommerce_company_client_churn_data` | `user_id` | `user_creation_datetime` | snapshot 또는 month-like | `recency`, `frequency`, `total_sales`, `month_revenue_eur`, `historic_aov` -> canonical로 변환 | `status` | `churn_factor`, future revenue proxy | supervised anchor |
| `churn_preprocessed` | `CustomerID` | implicit | snapshot | `OrderCount`, `CashbackAmount`, `DaySinceLastOrder` -> canonical snapshot 변환 | `Churn` | 없음 또는 spend proxy | aux baseline |
| `ecommerce_customer_data` | `Customer_ID` | implicit | snapshot | `Online_Purchases`, `Spending_Score` -> canonical snapshot 변환 | `Churn` | 없음 | aux baseline |

---

## 6. Branch A 모델 방향

### 6.1 추천 구조

- 입력: Branch A canonical feature table
- 전처리:
  - skewed count/value `log1p`
  - ratio clipping
  - missing flag 추가
  - dataset id / domain id optional embedding
- 모델:
  - **1차 baseline**: LightGBM / XGBoost
  - **브랜치 extractor 본선**: tabular MLP encoder

### 6.2 왜 MLP encoder가 맞는가

MLP를 권장하는 이유:

- panelization 후 입력이 tabular numeric 중심으로 정리된다.
- raw sequence 길이가 데이터셋마다 너무 달라서, 바로 RNN/Transformer로 통일하기 어렵다.
- 최종 ensemble head와 같은 방식의 dense representation을 만들기 쉽다.
- cross-dataset pretraining 시 canonical feature space에 잘 맞는다.

### 6.3 출력

Branch A는 최소 아래를 출력한다.

- `z_a`: 16~64차원 embedding
- `activity_decay_score`
- `value_drop_score`
- optional auxiliary predictions
  - `inactive_next_30d`
  - `next_30d_purchase_flag`
  - `next_30d_revenue`

---

## 7. 주된 목적과의 연결

Branch A는 프로젝트의 “쿠팡식 일반 구매 행동 감소”를 설명하는 핵심 브랜치다.

이 브랜치가 강하게 잡아야 하는 의미는 다음이다.

- 사용자가 아직 탈퇴하지 않았더라도 구매 activity가 약해질 수 있다.
- 사용 가치가 떨어지면 FE에서 보이는 `user_base` 하락 압력과 연결된다.
- 이 성분은 membership 이탈과는 다른 방식으로 `churn power` 를 밀어 올린다.

따라서 Branch A는 최종적으로 다음 질문에 답해야 한다.

> “이 사용자는 최근 구매/활동 패턴만 봐도 이미 빠르게 식고 있는가?”
