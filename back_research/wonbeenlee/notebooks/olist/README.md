# olist

## 1. 예측 태스크

- 기본 태스크: **직접 제공되는 churn label은 없음**
- 먼저 정의할 태스크:
  - **binary classification**: 고객 재구매 부재를 churn proxy로 정의
  - **binary / multiclass classification**: `order_status`, 배송 지연 여부, 저평점 여부
  - **regression**: `review_score`, 배송 지연일수, 고객 가치 집계
- 한 줄 해석: 실제 marketplace 거래/리뷰/배송 데이터를 join해서 고객 이탈 proxy 또는 서비스 품질 proxy를 정의해야 하는 multi-table e-commerce 데이터셋이다.

## 2. 전체 컬럼

### `olist_customers_dataset.csv`

```text
customer_id
customer_unique_id
customer_zip_code_prefix
customer_city
customer_state
```

### `olist_geolocation_dataset.csv`

```text
geolocation_zip_code_prefix
geolocation_lat
geolocation_lng
geolocation_city
geolocation_state
```

### `olist_order_items_dataset.csv`

```text
order_id
order_item_id
product_id
seller_id
shipping_limit_date
price
freight_value
```

### `olist_order_payments_dataset.csv`

```text
order_id
payment_sequential
payment_type
payment_installments
payment_value
```

### `olist_order_reviews_dataset.csv`

```text
review_id
order_id
review_score
review_comment_title
review_comment_message
review_creation_date
review_answer_timestamp
```

### `olist_orders_dataset.csv`

```text
order_id
customer_id
order_status
order_purchase_timestamp
order_approved_at
order_delivered_carrier_date
order_delivered_customer_date
order_estimated_delivery_date
```

### `olist_products_dataset.csv`

```text
product_id
product_category_name
product_name_lenght
product_description_lenght
product_photos_qty
product_weight_g
product_length_cm
product_height_cm
product_width_cm
```

### `olist_sellers_dataset.csv`

```text
seller_id
seller_zip_code_prefix
seller_city
seller_state
```

### `product_category_name_translation.csv`

```text
product_category_name
product_category_name_english
```

## 3. 데이터셋 메타데이터

- 데이터 성격: **실제 공개 e-commerce multi-table 데이터셋**이다.
- 출처 성격: Brazilian E-Commerce Public Dataset by Olist
- 도메인: **marketplace / merchant enablement / order fulfillment**
- 비즈니스 모델 관점:
  - Olist는 판매자와 고객을 연결하는 e-commerce / marketplace 운영 구조를 가진다.
  - 주문, 결제, 배송, 리뷰가 따로 분리되어 있어서 실제 서비스 운영 지표와 가깝다.
- direct churn label은 없지만, 운영 이벤트와 고객 반응이 풍부하다.

## 4. 컨텍스트

- 시간축: **명시적인 주문 시계열이 있는 multi-table 데이터**다.
- 확인된 대표 시간 범위:
  - `order_purchase_timestamp`: 2016-09-04 ~ 2018-10-17
  - `order_approved_at`: 2016-09-15 ~ 2018-09-03
  - `order_delivered_customer_date`: 2016-10-11 ~ 2018-10-17
  - `order_estimated_delivery_date`: 2016-09-30 ~ 2018-11-12
- 따라서 고객/주문 단위의 **time-aware aggregation**이 핵심이다.

## 5. 결론: 데이터 representation

- representation 단위:
  - raw level: 주문 / 결제 / 리뷰 / 상품 / 판매자 / 고객 테이블 분리
  - modeling level: **한 행 = 한 고객 또는 한 주문의 요약 상태**로 다시 만들어야 한다.
- 추천 `X`:
  - 결제 방식 / installment / payment value
  - 배송 지연 / estimated vs actual delivery gap
  - review score / review text 존재 여부
  - 카테고리 / 상품 크기 / freight cost
- 추천 `y` 후보:
  - 고객 재구매 없음 여부
  - 저평점 여부
  - 배송 지연 / 주문 취소 여부
- 비즈니스 도메인 해석:
  - direct churn 대신 **trust / delivery / review / repeat purchase**를 churn proxy 또는 state 변수로 쓰는 것이 자연스럽다.
