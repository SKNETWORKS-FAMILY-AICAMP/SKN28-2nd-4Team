# retailrocket_processed

## 1. 예측 태스크

- 기본 태스크:
  - **binary classification**: `target_event`
  - **regression**: `target_revenue`, `target_customer_value`, `target_actual_profit`
- 직접 제공되는 `y`: 위 target 계열 컬럼들
- 기본 입력 `X`: `row_id`, `user_id`, target 계열을 제외한 engineered feature 컬럼
- 한 줄 해석: raw event log를 이미 고객 수준으로 가공해 둔 feature-engineered benchmark로, downstream churn proxy나 value prediction을 바로 시험할 수 있다.

## 2. 전체 컬럼

### `retailrocket_customer_model.csv`

```text
row_id
user_id
length_mean
start_year_mean
start_yearday_mean
start_month_mean
start_monthday_mean
start_week_mean
start_weekday_mean
start_isweekend_mean
start_hour_mean
haspurchase_mean
click_count_mean
view_count_mean
cart_count_mean
purchase_count_mean
time_to_click_mean
time_to_view_mean
time_to_cart_mean
time_to_purchase_mean
view_revenue_mean
cart_revenue_mean
purchase_revenue_mean
time_to_click_revenue_mean
time_to_view_revenue_mean
time_to_cart_revenue_mean
time_to_purchase_revenue_mean
session_number_mean
inter_session_time_mean
session_recency_mean
purchase_number_mean
inter_purchase_time_mean
purchase_recency_mean
length_sum
start_year_sum
start_yearday_sum
start_month_sum
start_monthday_sum
start_week_sum
start_weekday_sum
start_isweekend_sum
start_hour_sum
haspurchase_sum
click_count_sum
view_count_sum
cart_count_sum
purchase_count_sum
time_to_click_sum
time_to_view_sum
time_to_cart_sum
time_to_purchase_sum
view_revenue_sum
cart_revenue_sum
purchase_revenue_sum
time_to_click_revenue_sum
time_to_view_revenue_sum
time_to_cart_revenue_sum
time_to_purchase_revenue_sum
session_number_sum
inter_session_time_sum
session_recency_sum
purchase_number_sum
inter_purchase_time_sum
purchase_recency_sum
length_min
start_year_min
start_yearday_min
start_month_min
start_monthday_min
start_week_min
start_weekday_min
start_isweekend_min
start_hour_min
haspurchase_min
click_count_min
view_count_min
cart_count_min
purchase_count_min
time_to_click_min
time_to_view_min
time_to_cart_min
time_to_purchase_min
view_revenue_min
cart_revenue_min
purchase_revenue_min
time_to_click_revenue_min
time_to_view_revenue_min
time_to_cart_revenue_min
time_to_purchase_revenue_min
session_number_min
inter_session_time_min
session_recency_min
purchase_number_min
inter_purchase_time_min
purchase_recency_min
length_max
start_year_max
start_yearday_max
start_month_max
start_monthday_max
start_week_max
start_weekday_max
start_isweekend_max
start_hour_max
haspurchase_max
click_count_max
view_count_max
cart_count_max
purchase_count_max
time_to_click_max
time_to_view_max
time_to_cart_max
time_to_purchase_max
view_revenue_max
cart_revenue_max
purchase_revenue_max
time_to_click_revenue_max
time_to_view_revenue_max
time_to_cart_revenue_max
time_to_purchase_revenue_max
session_number_max
inter_session_time_max
session_recency_max
purchase_number_max
inter_purchase_time_max
purchase_recency_max
length_stddev
start_year_stddev
start_yearday_stddev
start_month_stddev
start_monthday_stddev
start_week_stddev
start_weekday_stddev
start_isweekend_stddev
start_hour_stddev
haspurchase_stddev
click_count_stddev
view_count_stddev
cart_count_stddev
purchase_count_stddev
time_to_click_stddev
time_to_view_stddev
time_to_cart_stddev
time_to_purchase_stddev
view_revenue_stddev
cart_revenue_stddev
purchase_revenue_stddev
time_to_click_revenue_stddev
time_to_view_revenue_stddev
time_to_cart_revenue_stddev
time_to_purchase_revenue_stddev
session_number_stddev
inter_session_time_stddev
session_recency_stddev
purchase_number_stddev
inter_purchase_time_stddev
purchase_recency_stddev
length_cv
start_year_cv
start_yearday_cv
start_month_cv
start_monthday_cv
start_week_cv
start_weekday_cv
start_isweekend_cv
start_hour_cv
haspurchase_cv
click_count_cv
view_count_cv
cart_count_cv
purchase_count_cv
time_to_click_cv
time_to_view_cv
time_to_cart_cv
time_to_purchase_cv
view_revenue_cv
cart_revenue_cv
purchase_revenue_cv
time_to_click_revenue_cv
time_to_view_revenue_cv
time_to_cart_revenue_cv
time_to_purchase_revenue_cv
session_number_cv
inter_session_time_cv
session_recency_cv
purchase_number_cv
inter_purchase_time_cv
purchase_recency_cv
session_count_ratio
click_count_ratio
transaction_count_ratio
session_count_month_lag0
session_count_month_lag1
session_count_month_lag2
session_count_month_lag3
session_count_month_ma3
purchase_count_month_lag0
purchase_count_month_lag1
purchase_count_month_lag2
purchase_count_month_lag3
purchase_count_month_ma3
purchase_revenue_month_lag0
purchase_revenue_month_lag1
purchase_revenue_month_lag2
purchase_revenue_month_lag3
purchase_revenue_month_ma3
customer_value_month_lag0
customer_value_month_lag1
customer_value_month_lag2
customer_value_month_lag3
customer_value_month_ma3
view_latent_factor0
view_latent_factor1
view_latent_factor2
view_latent_factor3
view_latent_factor4
purchase_latent_factor0
purchase_latent_factor1
purchase_latent_factor2
purchase_latent_factor3
purchase_latent_factor4
purchase_latent_factor5
purchase_latent_factor6
purchase_latent_factor7
purchase_latent_factor8
target_event
target_revenue
target_customer_value
time_step
target_customer_value_lag1
target_actual_profit
```

### `retailrocket_data_dictionary.csv`

```text
Set
Attribute
Description
Variable name
```

## 3. 데이터셋 메타데이터

- 데이터 성격: **원천은 실제 공개 event log지만, 현재 파일은 연구용으로 가공된 feature-engineered 데이터셋**이다.
- 도메인: **e-commerce recommendation / browsing-to-purchase funnel**
- 비즈니스 모델 관점:
  - 고객의 session, click, view, cart, purchase 행동을 여러 통계량으로 압축했다.
  - 원본 raw event를 그대로 다루지 않고, 모델링하기 쉬운 customer-window feature pool을 제공한다.

## 4. 컨텍스트

- 시간축: **월 lag와 이동평균이 들어 있는 시계열 요약 테이블**이다.
- 주요 시간 맥락:
  - `session_count_month_lag0` ~ `lag3`
  - `purchase_count_month_lag0` ~ `lag3`
  - `purchase_revenue_month_lag0` ~ `lag3`
  - `customer_value_month_lag0` ~ `lag3`
- 따라서 raw event timestamp는 사라졌지만, **최근 월별 추세를 이미 feature로 담은 representation**이다.

## 5. 결론: 데이터 representation

- representation 단위: **한 행 = 한 사용자의 일정 시점 customer summary + 미래 target**
- 추천 `X`:
  - session / click / view / cart / purchase 통계량
  - recency / inter-session gap
  - 월 lag / moving average
  - latent factor 계열
- 추천 `y`:
  - 분류: `target_event`
  - 회귀: `target_revenue`, `target_customer_value`, `target_actual_profit`
- 비즈니스 도메인 해석:
  - 사용자의 최근 행동 패턴과 가치 변화를 바탕으로
  - 다음 이벤트 발생, 미래 매출, 고객가치를 예측하는 구조다.
  - 프로젝트에서는 raw event 대신 빠르게 **state / reward proxy**를 만들어 볼 수 있다.
