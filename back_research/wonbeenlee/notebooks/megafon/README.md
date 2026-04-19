# megafon

## 1. 예측 태스크

- 기본 태스크: **binary classification**
- 직접 제공되는 `y`: `conversion`
- treatment 컬럼: `treatment_group`
- 기본 입력 `X`: `X_1`~`X_50`
- 한 줄 해석: 통신사 retention intervention 시나리오를 synthetic하게 만든 uplift classification benchmark다.

## 2. 전체 컬럼

```text
treatment_group
X_1
X_2
X_3
X_4
X_5
X_6
X_7
X_8
X_9
X_10
X_11
X_12
X_13
X_14
X_15
X_16
X_17
X_18
X_19
X_20
X_21
X_22
X_23
X_24
X_25
X_26
X_27
X_28
X_29
X_30
X_31
X_32
X_33
X_34
X_35
X_36
X_37
X_38
X_39
X_40
X_41
X_42
X_43
X_44
X_45
X_46
X_47
X_48
X_49
X_50
conversion
```

## 3. 데이터셋 메타데이터

- 데이터 성격: **synthetic benchmark**다.
- 실제 통신사 문제를 닮게 만든 생성형 uplift 데이터셋이다.
- 도메인: **telecom subscription / intervention effect modeling**
- 비즈니스 모델 관점:
  - 실제 고객 데이터의 민감한 raw feature 대신 익명화된 synthetic feature로
  - 개입군 / 비개입군의 conversion 차이를 예측하도록 설계됐다.

## 4. 컨텍스트

- 시간축: **명시적 timestamp는 없다.**
- 따라서 sequence/timeframe 분석보다
  - 처리군과 대조군이 균형 있게 존재하는지
  - conversion 분포가 어떤지
를 먼저 보는 것이 맞다.

## 5. 결론: 데이터 representation

- representation 단위: **한 행 = 한 synthetic 고객 샘플의 상태 + treatment + outcome**
- 추천 `X`: `X_1`~`X_50`
- 추천 `y`: `conversion`
- treatment: `treatment_group`
- 비즈니스 도메인 해석:
  - retention intervention을 했을 때 반응할 고객을 찾는 구조다.
  - 프로젝트에서는 uplift 코드 경로와 평가 지표를 빠르게 점검하는 smoke test 용도로 적합하다.
