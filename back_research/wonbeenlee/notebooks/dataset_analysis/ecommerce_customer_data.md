# ecommerce_customer_data

## 1. 예측 태스크

- 기본 태스크: **binary classification**
- 직접 제공되는 `y`: `Churn`
- 기본 입력 `X`: `Customer_ID`를 제외한 고객 프로필 / 구매 행동 컬럼
- 한 줄 해석: 고객 단위 snapshot 데이터를 사용해 해당 고객이 churn하는지 분류하는 가장 단순한 baseline 데이터셋이다.

## 2. 전체 컬럼

```text
Customer_ID
Age
Gender
Annual_Income
Spending_Score
Membership_Years
Online_Purchases
Discount_Usage
Churn
```

## 3. 데이터셋 메타데이터

- 데이터 성격: **학습용 / 예시용 churn 데이터셋**으로 보는 편이 안전하다.
- 실제 기업 raw export라기보다는, churn 예측 연습을 위해 정리된 single-table benchmark에 가깝다.
- 도메인: 일반적인 **e-commerce membership / online shopping 서비스**를 가정한 고객 데이터.
- 비즈니스 모델 관점:
  - 회원 기반 온라인 쇼핑 서비스
  - 고객의 구매 활동과 할인 사용 성향을 바탕으로 유지/이탈을 보려는 구조

## 4. 컨텍스트

- 시간축: **명시적인 calendar timestamp는 없다.**
- 대신 다음처럼 기간성 힌트는 있다.
  - `Membership_Years`: 고객이 얼마나 오래 유지되었는지
  - `Online_Purchases`: 누적 또는 집계된 구매 행동 강도
  - `Discount_Usage`: 가격/혜택 반응 강도
- 즉 이 데이터는 event sequence가 아니라 **고객 상태를 요약한 tabular snapshot**으로 보는 것이 맞다.

## 5. 결론: 데이터 representation

- representation 단위: **한 행 = 한 고객의 현재 상태 요약**
- 추천 `X`:
  - `Age`, `Gender`, `Annual_Income`
  - `Spending_Score`, `Membership_Years`
  - `Online_Purchases`, `Discount_Usage`
- 추천 `y`: `Churn`
- 비즈니스 도메인 해석:
  - 소득/소비성향/구매빈도/할인반응을 바탕으로
  - 현재 고객이 서비스에 계속 남을지 이탈할지를 분류하는 구조다.
  - 프로젝트 관점에서는 가장 빠른 **direct churn baseline**으로 쓰기 좋다.
