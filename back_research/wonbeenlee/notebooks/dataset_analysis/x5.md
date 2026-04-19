# x5

## 1. 예측 태스크

- 기본 태스크: **binary classification**
- 직접 제공되는 `y`: `target` in `uplift_train.csv.gz`
- treatment 컬럼: `treatment_flg`
- 기본 입력 `X`: `uplift_train`, `clients`, `purchases`를 `client_id` 기준으로 join / aggregate 해서 구성
- 한 줄 해석: 리테일 loyalty / purchase history와 마케팅 커뮤니케이션 여부를 함께 사용해 이후 구매 반응을 예측하는 multi-table uplift 데이터셋이다.

## 2. 전체 컬럼

### `uplift_train.csv.gz`

```text
client_id
treatment_flg
target
```

### `clients.csv.gz`

```text
client_id
first_issue_date
first_redeem_date
age
gender
```

### `purchases.csv.gz`

```text
client_id
transaction_id
transaction_datetime
regular_points_received
express_points_received
regular_points_spent
express_points_spent
purchase_sum
store_id
product_id
product_quantity
trn_sum_from_iss
trn_sum_from_red
```

## 3. 데이터셋 메타데이터

- 데이터 성격: **실제 리테일 기업의 multi-table uplift 데이터**다.
- 출처 성격: X5 RetailHero uplift modeling competition 계열
- 도메인: **grocery / retail chain / loyalty program**
- 비즈니스 모델 관점:
  - 고객에게 커뮤니케이션이나 프로모션을 주고
  - 포인트 적립/사용, 구매액, 구매 빈도 변화가 이후 반응으로 이어지는지를 본다.

## 4. 컨텍스트

- 시간축: **명시적 datetime이 포함된 multi-table sequence 데이터**다.
- 확인된 날짜 범위:
  - `clients.first_issue_date`: 2017-04-04 ~ 2019-03-15
  - `clients.first_redeem_date`: 2017-04-11 ~ 2019-11-20
  - `purchases.transaction_datetime`: 2018-11-21 ~ 2019-03-18
- 즉 customer profile과 loyalty/purchase history를 함께 쓰는 **join-first dataset**이다.

## 5. 결론: 데이터 representation

- representation 단위:
  - raw level: 구매 이벤트 / 고객 프로필 / label anchor가 분리된 multi-table
  - modeling level: **한 행 = 한 고객의 communication 시점 직전 상태 요약**으로 다시 만들어야 한다.
- 추천 `X`:
  - 고객 기본 속성 (`age`, `gender`)
  - loyalty 이력 (`first_issue_date`, `first_redeem_date`)
  - 구매 집계 (`purchase_sum`, `product_quantity`, 포인트 적립/사용 등)
- 추천 `y`: `target`
- treatment: `treatment_flg`
- 비즈니스 도메인 해석:
  - 고객의 loyalty / purchase history를 기반으로
  - 어떤 고객이 마케팅 action 이후 실제 구매 반응을 보일지를 분류하는 구조다.
  - 프로젝트에서는 **상태 aggregation 설계**를 시험하기 좋은 리테일 데이터다.
