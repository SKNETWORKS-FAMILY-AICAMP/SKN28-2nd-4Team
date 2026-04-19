# churn_preprocessed

## 1. 예측 태스크

- 기본 태스크: **binary classification**
- 직접 제공되는 `y`: `Churn`
- 기본 입력 `X`: `CustomerID`를 제외한 고객 경험 / 주문 / 혜택 / 불만 관련 컬럼
- 한 줄 해석: e-commerce churn용 예시 데이터를 내부에서 한 번 정리한 후 바로 baseline 실험에 쓰기 좋은 preprocessed benchmark다.

## 2. 전체 컬럼

```text
CustomerID
Churn
Tenure
PreferredLoginDevice
CityTier
WarehouseToHome
PreferredPaymentMode
Gender
HourSpendOnApp
NumberOfDeviceRegistered
PreferedOrderCat
SatisfactionScore
MaritalStatus
NumberOfAddress
Complain
OrderAmountHikeFromlastYear
CouponUsed
OrderCount
DaySinceLastOrder
CashbackAmount
```

## 3. 데이터셋 메타데이터

- 데이터 성격: **내부 가공본 / 학습용 데이터셋**이다.
- 원천은 e-commerce churn 예시 데이터 계열이고, 현재 파일은 내부 연구 흐름에 맞춰 정리된 버전이다.
- 도메인: **online shopping / membership commerce**
- 비즈니스 모델 관점:
  - 로그인 디바이스, 결제 방식, 주소 수, 주문 횟수, 마지막 주문 이후 경과일, 캐시백/쿠폰 활용 등이 고객 유지와 연결된다.

## 4. 컨텍스트

- 시간축: **calendar timestamp는 없고 요약형 duration / recency 컬럼이 있다.**
- 시간 맥락을 주는 컬럼:
  - `Tenure`
  - `DaySinceLastOrder`
  - `OrderCount`
  - `OrderAmountHikeFromlastYear`
- 즉 sequence log가 아니라 **고객 행동을 요약한 churn-ready tabular data**다.

## 5. 결론: 데이터 representation

- representation 단위: **한 행 = 한 고객의 현재 상태 및 최근 행동 요약**
- 추천 `X`:
  - 서비스 접근/경험: `PreferredLoginDevice`, `HourSpendOnApp`, `NumberOfDeviceRegistered`
  - 상거래/혜택: `OrderCount`, `CouponUsed`, `CashbackAmount`, `OrderAmountHikeFromlastYear`
  - 고객 상태: `SatisfactionScore`, `Complain`, `DaySinceLastOrder`, `Tenure`
- 추천 `y`: `Churn`
- 비즈니스 도메인 해석:
  - 만족도, 최근 구매, 불만, 가격/혜택 반응을 함께 사용해
  - 고객이 쇼핑 서비스를 떠날지를 분류하는 구조다.
  - 프로젝트에서는 **state 변수 후보를 빠르게 읽어내기 좋은 정리된 baseline**으로 쓸 수 있다.
