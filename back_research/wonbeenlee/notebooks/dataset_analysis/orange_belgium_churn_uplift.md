# orange_belgium_churn_uplift

## 1. 예측 태스크

- 기본 태스크: **binary classification**
- 직접 제공되는 `y`: `y`
- treatment 컬럼: `t`
- 기본 입력 `X`: `PC1`~`PC160`, `FACTOR1`~`FACTOR18`
- 한 줄 해석: 통신사 고객에게 retention intervention을 했을 때 outcome이 어떻게 달라지는지 보는 uplift 성격의 binary prediction 데이터셋이다.

## 2. 전체 컬럼

```text
PC1 ~ PC160
FACTOR1 ~ FACTOR18
y
t
```

컬럼 패턴을 풀어 쓰면 다음과 같다.

- `PC1`, `PC2`, ..., `PC160`
- `FACTOR1`, `FACTOR2`, ..., `FACTOR18`
- `y`, `t`

## 3. 데이터셋 메타데이터

- 데이터 성격: **실제 통신사 데이터를 익명화 / 차원축소해 공개한 uplift benchmark**로 보는 것이 적절하다.
- 출처 성격: Orange Belgium churn uplift 계열 공개 데이터
- 도메인: **telecom subscription / retention campaign**
- 비즈니스 모델 관점:
  - 통신사는 장기 가입자를 유지하기 위해 개입(action)을 수행할 수 있다.
  - 이 데이터는 원시 feature를 직접 노출하지 않고, PCA / factor 형태의 익명화 representation으로 제공한다.

## 4. 컨텍스트

- 시간축: **명시적 timestamp는 제공되지 않는다.**
- 대신 이 데이터는 time-series 원본을 직접 다루기보다, 개입 시점 전후의 outcome을 모델링하기 위한 **anonymized treatment-response table**이다.
- 따라서 이 데이터의 핵심은 절대적인 날짜보다
  - `t`가 개입 여부를 어떻게 나타내는지
  - `y`가 개입 후 결과를 어떻게 나타내는지에 있다.

## 5. 결론: 데이터 representation

- representation 단위: **한 행 = 한 고객의 익명화된 상태 벡터 + treatment + outcome**
- 추천 `X`: `PC1`~`PC160`, `FACTOR1`~`FACTOR18`
- 추천 `y`: `y`
- treatment: `t`
- 비즈니스 도메인 해석:
  - 통신사 고객의 상태를 직접 해석 가능한 feature 대신 latent representation으로 두고,
  - 특정 retention action을 했을 때 binary outcome이 어떻게 달라지는지 예측하는 구조다.
  - 프로젝트에서는 **직접 churn 예측보다는 intervention effect prior**를 읽는 용도로 더 적합하다.
