# retailrocket_raw

## 1. 예측 태스크

- 기본 태스크: **직접 제공되는 churn label은 없음**
- 먼저 정의할 태스크:
  - **binary classification**: 다음 기간 purchase 여부, inactivity 기반 churn proxy
  - **regression**: future revenue, customer value, session intensity
- 한 줄 해석: 실제 e-commerce user event log를 기반으로 고객-세션-상품 상호작용을 집계해 downstream churn proxy를 만들어야 하는 raw sequence 데이터셋이다.

## 2. 전체 컬럼

### `events.csv`

```text
timestamp
visitorid
event
itemid
transactionid
```

### `category_tree.csv`

```text
categoryid
parentid
```

### `item_properties_part1.csv`

```text
timestamp
itemid
property
value
```

### `item_properties_part2.csv`

```text
timestamp
itemid
property
value
```

## 3. 데이터셋 메타데이터

- 데이터 성격: **실제 공개 e-commerce event log**다.
- 출처 성격: Retailrocket recommender system dataset
- 도메인: **e-commerce browsing / cart / purchase funnel**
- 비즈니스 모델 관점:
  - 사용자가 상품을 조회하고 장바구니에 담고 구매하는 행동이 로그로 남는다.
  - 상품 속성과 카테고리 구조까지 함께 제공되어 funnel 해석이 가능하다.

## 4. 컨텍스트

- 시간축: **명시적인 이벤트 시계열 데이터**다.
- 확인된 대표 시간 범위:
  - `events.csv.timestamp`: 2015-05-03 ~ 2015-09-18 (UTC)
- 따라서 고객 단위가 아니라 **이벤트 -> 세션 -> visitor-window**로 representation을 다시 만들어야 한다.

## 5. 결론: 데이터 representation

- representation 단위:
  - raw level: **한 행 = 한 이벤트**
  - modeling level: **한 행 = 한 visitor의 일정 기간 행동 요약**으로 변환 필요
- 추천 `X`:
  - view / cart / transaction count
  - recency, inter-event gap, category diversity, item property feature
- 추천 `y` 후보:
  - 다음 horizon purchase 여부
  - 일정 기간 inactivity 여부
  - future revenue
- 비즈니스 도메인 해석:
  - 사용자의 browsing-to-purchase funnel을 기반으로
  - 고객 가치 하락이나 구매 중단을 churn proxy로 정의하는 게 핵심이다.
