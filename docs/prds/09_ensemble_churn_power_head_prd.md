# Ensemble PRD: Final Churn Power Head

## 0. 문서 목적

본 문서는 Branch A / B / C 출력 위에서 최종 `churn power` 를 계산하는 ensemble head를 정의한다.

이 문서는 특히 아래 질문에 답해야 한다.

1. 최종 head의 입력은 무엇인가
2. 학습용 dataset은 어떻게 준비하는가
3. `MLP` 가 마지막 모델로 적절한가
4. 왜 이 구조가 프로젝트 목적과 맞는가

---

## 1. 최종 head의 역할

최종 head는 아래 세 브랜치의 출력을 받아,
FE와 엔진이 사용할 단일 위험 요약값을 만든다.

- Branch A: commerce/value/activity
- Branch B: membership/subscription/lifecycle
- Branch C: trust/support/intervention

출력은 최소 아래를 포함한다.

- `churn_risk_probability`
- `churn_power_score` (0~100)
- `expected_user_base_delta` 또는 그에 가까운 macro proxy

즉 마지막 모델은 단순 평균기가 아니라,
세 분야의 서로 다른 위험 representation을 합쳐 **프로젝트용 최종 위험 해석기** 역할을 한다.

---

## 2. 입력 계약(Input Contract)

### 2.1 브랜치 출력

각 샘플은 최소 아래 입력을 가진다.

| 입력 | 설명 |
| --- | --- |
| `z_a` | Branch A embedding |
| `z_b` | Branch B embedding |
| `z_c` | Branch C embedding |
| `score_a` | activity/value decay summary score |
| `score_b` | lifecycle/lock-in risk summary score |
| `score_c` | trust/intervention risk summary score |
| `mask_a` | Branch A 정보 존재 여부 |
| `mask_b` | Branch B 정보 존재 여부 |
| `mask_c` | Branch C 정보 존재 여부 |
| `domain_id` | 데이터셋 또는 도메인 구분자 |
| `horizon_id` | 30d / 60d / cycle 등 horizon 구분 |

### 2.2 왜 mask가 필요한가

모든 데이터셋이 세 브랜치를 완전히 다 제공하지는 않는다.

예:

- `retailrocket_raw` 는 A가 강하지만 B/C는 약하다.
- `saas_subscription_churn` 는 B/C가 강하고 A도 일부 존재한다.
- `olist` 는 A/C가 강하지만 B는 약하다.

따라서 final head는 missing branch를 자연스럽게 처리할 수 있어야 한다.

---

## 3. 학습용 dataset 준비 방식

### 3.1 원칙

final head 학습용 dataset은 raw dataset를 직접 concat해서 만들지 않는다.

대신 아래 순서를 따른다.

1. 각 데이터셋을 panel sample로 변환
2. 각 panel sample에서 Branch A/B/C feature block 생성
3. 브랜치별 encoder를 통과시켜 `z_a`, `z_b`, `z_c` 와 branch score 생성
4. 이를 하나의 meta-table로 합침
5. meta-table 위에서 final head 학습

즉 최종 학습 데이터는 아래와 같은 **meta dataset** 이다.

```text
sample_id
entity_id
as_of_date
domain_id
z_a
z_b
z_c
score_a
score_b
score_c
mask_a
mask_b
mask_c
y_class
y_reg
y_churn_power
```

### 3.2 공통 target 설계

최종 head를 학습하려면 dataset마다 다른 target을 공통 공간으로 맞춰야 한다.

권장 target 층은 다음 3개다.

1. `y_class`
   - 공통 binary target
   - 예: `churn_next_30d`, `inactive_next_30d`, `non_renewal_next_cycle`, `no_purchase_next_60d`
2. `y_reg`
   - 공통 연속 target
   - 예: `next_30d_spend`, `days_until_churn`, `value_loss_ratio`
3. `y_churn_power`
   - 최종 0~100 score로 정규화할 target

### 3.3 `y_churn_power` 구성 원칙

권장 방식은 아래와 같다.

```text
y_churn_power
= alpha * binary_churn_like_event
+ beta * value_loss_ratio
+ gamma * activity_drop_ratio
+ delta * trust_damage_proxy
```

여기서 중요한 점:

- dataset별 raw target은 달라도
- 최종적으로는 **공통 위험 강도 scale** 위에 올려야 한다.

### 3.4 어떤 데이터셋이 final head 학습에 좋은가

우선순위는 아래와 같다.

| 데이터셋 | 이유 |
| --- | --- |
| `saas_subscription_churn` | A/B/C 세 브랜치 성분이 모두 존재 |
| `x5` | A/B/C를 모두 연결할 수 있는 loyalty retail bridge |
| `churn_preprocessed` | compact하지만 A/B/C snapshot이 모두 존재 |
| `ecommerce_company_client_churn_data` | A/C가 강하고 direct churn label 존재 |
| `olist` | A/C가 강하고 time-aware aggregation 가능 |

이 데이터셋들은 final head가 브랜치 간 상호작용을 배우는 데 특히 유리하다.

---

## 4. MLP가 맞는 방식인가

## 4.1 결론

**예, 현재 설계에서는 MLP가 최종 head의 기본 선택으로 타당하다.**

다만 조건이 있다.

- 입력이 raw column이 아니라 **브랜치별 representation / normalized score / mask** 여야 한다.
- 그리고 반드시 비교 baseline을 둬야 한다.

### 4.2 왜 MLP가 타당한가

1. **입력이 dense embedding + summary score 구조다**
   - final head는 수십 개의 raw 컬럼보다,
     이미 브랜치에서 압축된 `z_a`, `z_b`, `z_c`, `score_a`, `score_b`, `score_c` 를 받는다.
   - 이런 입력은 트리보다 MLP에서 자연스럽게 상호작용을 학습하기 좋다.

2. **브랜치 간 비선형 상호작용이 중요하다**
   - 예: 구매 감소는 약하지만 support 폭증과 renewal failure가 같이 오면 급격히 위험해질 수 있다.
   - 이런 조합은 단순 선형 합보다 비선형 결합이 더 적절하다.

3. **mask 처리와 domain conditioning이 쉽다**
   - branch missing mask
   - domain id embedding
   - horizon id embedding
   를 넣기 쉽다.

4. **최종 score output과 잘 맞는다**
   - FE의 `churnRisk` 는 continuous score 성격이 강하다.
   - MLP head는 classification + regression + score output을 multi-task로 내기 좋다.

### 4.3 언제 MLP가 부적절할 수 있는가

아래 상황이면 MLP가 과할 수 있다.

- 입력이 embedding 없이 브랜치 scalar score 몇 개뿐인 경우
- 학습 샘플 수가 너무 작고 도메인 간 분포 차이가 심한 경우
- 최종 출력이 사실상 선형 결합으로 충분한 경우

이 경우엔 아래를 같이 비교해야 한다.

- Logistic Regression
- XGBoost / LightGBM
- 작은 MLP

### 4.4 권장 실험 순서

1. Logistic Regression meta-head
2. LightGBM meta-head
3. 2~3 layer MLP meta-head

이 셋을 비교한 뒤, 성능과 안정성, calibration 기준으로 최종 선택한다.

즉 현재 문서의 기본 방향은 **MLP 우선 검토** 이지만,
실험적으로는 반드시 tree / linear baseline과 비교한다.

---

## 5. 최종 학습 파이프라인 요구

### 5.1 단계

1. dataset grouping 확정
2. dataset별 panel 생성
3. Branch A/B/C canonical feature 생성
4. branch별 normalization 및 EDA
5. branch별 encoder 학습
6. branch output 저장
7. meta dataset 생성
8. final head 학습
9. calibration 및 FE scale 정규화

### 5.2 normalization 규칙

- branch 내부 normalization은 branch별로 수행
- final head에서는 아래만 유지
  - branch embedding
  - branch score
  - branch mask
  - domain indicator
  - horizon indicator

즉 final head는 raw feature normalization보다,
**브랜치 출력의 안정화와 calibration** 이 더 중요하다.

### 5.3 loss 설계

권장 loss는 multi-task 구조다.

- `L_cls`: churn-like event classification loss
- `L_reg`: value / time-to-event regression loss
- `L_power`: final normalized churn power regression loss

```text
L_total = a * L_cls + b * L_reg + c * L_power
```

---

## 6. 최종 목적과의 연결

final head가 있어야 프로젝트가 아래 메시지를 가질 수 있다.

- 단일 도메인 데이터만 본 위험도가 아니다.
- 구매 감소, membership lifecycle, trust/intervention을 함께 본 결과다.
- 사용자의 전략 선택은 이 세 축을 동시에 흔들며,
  FE는 그 결과를 하나의 `churnRisk` 와 상태 변화로 보여줄 수 있다.

즉 final head는 단순 앙상블이 아니라,
프로젝트 전체 메시지인 **state-based retention risk synthesis** 를 담당하는 핵심 레이어다.

---

## 7. 완료 기준

이 문서 기준으로 final head 설계가 준비되었다고 보려면 아래가 만족되어야 한다.

1. Branch A/B/C 입력 계약이 정의되어 있다.
2. meta dataset 구조가 정의되어 있다.
3. 공통 target (`y_class`, `y_reg`, `y_churn_power`) 정의 원칙이 있다.
4. 왜 MLP를 쓰는지 justification이 있다.
5. MLP와 비교할 baseline meta-head가 명시되어 있다.
