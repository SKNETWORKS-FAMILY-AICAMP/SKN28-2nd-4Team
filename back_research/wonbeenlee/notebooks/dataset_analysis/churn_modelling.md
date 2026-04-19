# churn_modelling

## 1. 예측 태스크

- 기본 태스크: **binary classification**
- 직접 제공되는 `y`: `Exited`
- 기본 입력 `X`: `RowNumber`, `CustomerId`, `Surname`를 제외한 고객 금융/계정 컬럼
- 한 줄 해석: 은행 고객 snapshot을 이용해 고객이 이탈했는지(`Exited`)를 분류하는 banking churn benchmark다.

## 2. 전체 컬럼

```text
RowNumber
CustomerId
Surname
CreditScore
Geography
Gender
Age
Tenure
Balance
NumOfProducts
HasCrCard
IsActiveMember
EstimatedSalary
Exited
```

## 3. 데이터셋 메타데이터

- 데이터 성격: **학습용 / 예시용 banking churn 데이터셋**으로 보는 편이 안전하다.
- 실제 은행 도메인을 모사하지만, production raw log보다는 교육/benchmark 성격이 강하다.
- 도메인: **retail banking / account relationship management**
- 비즈니스 모델 관점:
  - 고객이 은행 계좌와 금융 상품을 유지하는 구조
  - 신용점수, 잔액, 상품 수, 활성 상태가 관계 유지의 핵심 변수로 작동한다.

## 4. 컨텍스트

- 시간축: **명시적인 timestamp는 없다.**
- 대신 관계 기간과 상태를 나타내는 컬럼이 있다.
  - `Tenure`
  - `Balance`
  - `NumOfProducts`
  - `IsActiveMember`
- 따라서 이 데이터는 **고객 관계 상태를 한 번에 캡처한 snapshot table**로 보는 것이 적절하다.

## 5. 결론: 데이터 representation

- representation 단위: **한 행 = 한 은행 고객의 현재 관계 상태**
- 추천 `X`:
  - `CreditScore`, `Geography`, `Gender`, `Age`
  - `Tenure`, `Balance`, `NumOfProducts`
  - `HasCrCard`, `IsActiveMember`, `EstimatedSalary`
- 추천 `y`: `Exited`
- 비즈니스 도메인 해석:
  - 고객의 금융 건강도와 계정 활성 상태를 입력으로 두고
  - 해당 고객이 은행 서비스를 떠났는지 분류하는 구조다.
  - 프로젝트에서는 **금융형 lock-in / inactivity** 관점을 비교할 때 유용하다.
