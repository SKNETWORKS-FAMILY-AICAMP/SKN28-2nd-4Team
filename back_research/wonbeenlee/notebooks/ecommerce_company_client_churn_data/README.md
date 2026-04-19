# ecommerce_company_client_churn_data

## 1. 예측 태스크

- 기본 태스크: **binary classification**
- 직접 제공되는 `y`: `status`
- 보조적으로 같이 볼 컬럼: `churn_factor`
- 기본 입력 `X`: `user_id`, `status`, `churn_factor`를 제외한 lifecycle / revenue / recency / support 관련 컬럼
- 한 줄 해석: 고객 계정 단위의 장기 집계 피처를 사용해 현재 고객 상태가 `ok`인지 `churned`인지 분류하는 데이터셋이다.

## 2. 전체 컬럼

```text
user_id
platform
market_country
user_creation_datetime
confirmation_datetime
first_purchase_datetime
last_purchase_datetime
first_integration_datetime
last_segment_recorded
longevity
total_sales
avg_sales_per_day
min_days_btwn_sales
frst_quartile_days_btwn_sales
avg_days_btwn_sales
median_days_btwn_sales
thrd_quartile_days_btwn_sales
max_days_btwn_sales
min_days_btwn_sale_date
fst_quartile_days_btwn_sale_date
avg_days_btwn_sale_date
median_days_btwn_sale_date
thrd_quartile_days_btwn_sale_date
frequency
recency
month_label_count
quarter_label_count
year_label_count
previous_year_label_count
historic_label_count
month_revenue_eur
quarter_revenue_eur
year_revenue_eur
previous_year_revenue_eur
historic_revenue_eur
month_average_order_value
quarter_aov
year_aov
year_plat_cntry_aov
previous_year_aov
previous_year_plat_cntry_aov
historic_aov
csat
cs_tickets_good
cs_tickets_offered
cs_tickets_unoffered
cs_tickets_bad
customer_feedback_tickets
total_tickets
churn_factor
status
```

## 3. 데이터셋 메타데이터

- 데이터 성격: **준실제 / 익명화된 실제 기업 client 데이터에 가까운 공개 churn 데이터셋**이다.
- 도메인: **internet shipment reselling company** 계열로 알려진 데이터셋이다.
- 비즈니스 모델 관점:
  - 온라인 판매자나 고객사에게 배송/물류 관련 서비스를 제공하는 B2B 또는 B2B2C형 서비스로 해석할 수 있다.
  - 고객 lifecycle, 거래 빈도, 최근성, 매출, 지원 티켓, 만족도 같은 운영 지표가 함께 들어 있다.
- 프로젝트 관점에서는 단순 인구통계형 churn보다 더 실제 운영 지표에 가까운 feature pool을 제공한다.

## 4. 컨텍스트

- 시간축: **명시적인 datetime 컬럼이 포함된 고객 집계형 데이터**다.
- 확인된 주요 날짜 범위:
  - `user_creation_datetime`: 2012-06-25 ~ 2022-03-19
  - `first_purchase_datetime`: 2017-08-02 ~ 2022-03-19
  - `last_purchase_datetime`: 2018-06-15 ~ 2022-04-21
  - `first_integration_datetime`: 2017-08-02 ~ 2022-03-19
- 즉 raw event log는 아니지만, **장기간 고객 관계의 누적 결과를 요약한 account-level snapshot**으로 볼 수 있다.

## 5. 결론: 데이터 representation

- representation 단위: **한 행 = 한 고객사 / 고객 계정의 누적 상태 요약**
- 추천 `X`:
  - lifecycle 시점 컬럼
  - revenue / frequency / recency / AOV 계열
  - support / CSAT / feedback 티켓 계열
- 추천 `y`: `status`
- 보조 해석용: `churn_factor`
- 비즈니스 도메인 해석:
  - 거래가 얼마나 자주 일어났는지, 최근 거래가 얼마나 가까운지,
  - 평균 주문 가치가 어떤지,
  - 고객센터 이슈와 만족도가 어떤지를 합쳐
  - 해당 계정이 유지 상태인지 churn 상태인지 분류하는 구조다.
  - 프로젝트에서는 **RFM + support + trust proxy**를 동시에 볼 수 있는 좋은 후보 데이터다.
