# ibm_telco_customer_churn

## 1. 예측 태스크

- 기본 태스크: **binary classification**
- 직접 제공되는 `y`: `Churn`
- 기본 입력 `X`: `customerID`를 제외한 가입자 속성 / 계약 / 부가서비스 / 결제 컬럼
- 한 줄 해석: 통신 가입자 snapshot 정보를 바탕으로 해당 가입자가 churn할지 분류하는 대표적인 telecom benchmark다.

## 2. 전체 컬럼

```text
customerID
gender
SeniorCitizen
Partner
Dependents
tenure
PhoneService
MultipleLines
InternetService
OnlineSecurity
OnlineBackup
DeviceProtection
TechSupport
StreamingTV
StreamingMovies
Contract
PaperlessBilling
PaymentMethod
MonthlyCharges
TotalCharges
Churn
```

## 3. 데이터셋 메타데이터

- 데이터 성격: **실제 통신사 도메인을 반영한 공개 샘플 데이터셋**이다.
- IBM 공식 샘플로 널리 쓰이며, raw production export라기보다 분석/학습을 위해 정리된 benchmark에 가깝다.
- 도메인: **subscription 기반 telecom / internet / bundled service provider**
- 비즈니스 모델 관점:
  - 고객은 장기 계약 또는 month-to-month 계약을 유지한다.
  - 전화, 인터넷, 보안, 백업, 디바이스 보호, 스트리밍 같은 번들 서비스가 lock-in과 churn에 영향을 준다.

## 4. 컨텍스트

- 시간축: **명시적인 timestamp는 없고 subscriber snapshot 구조**다.
- 대신 시간 관련 상태는 다음처럼 들어 있다.
  - `tenure`: 가입 지속 기간
  - `MonthlyCharges`, `TotalCharges`: 누적 과금 힌트
  - `Contract`: 장기/단기 계약 구조
- 즉 sequence가 아니라 **가입자 현재 상태를 요약한 customer-level tabular data**로 쓰는 것이 맞다.

## 5. 결론: 데이터 representation

- representation 단위: **한 행 = 한 가입자 상태 요약**
- 추천 `X`:
  - 가구/인구통계: `SeniorCitizen`, `Partner`, `Dependents`
  - 서비스 구성: `InternetService`, `OnlineSecurity`, `TechSupport`, `StreamingTV`, `StreamingMovies`
  - 계약/과금: `Contract`, `PaymentMethod`, `MonthlyCharges`, `TotalCharges`, `tenure`
- 추천 `y`: `Churn`
- 비즈니스 도메인 해석:
  - 계약 강도와 번들 서비스 조합이 고객 lock-in을 얼마나 만들었는지,
  - 과금 구조와 지원 수준이 churn pressure를 얼마나 높였는지를 보고
  - 가입자 이탈 여부를 분류하는 구조다.
