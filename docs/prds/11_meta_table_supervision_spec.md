# 메타 테이블 학습 요구사항 문서: Meta Table Supervision Specification

## 0. 문서 목적

본 문서는 최종 `churn power` 모델의 마지막 단계에서 사용하는 `meta table` 을 어떻게 정의하고 생성할지 정리한다.

이 문서가 답해야 하는 질문은 아래와 같다.

1. `meta table` 은 무엇인가
2. 왜 필요한가
3. 어떤 컬럼 구조를 가져야 하는가
4. 각 브랜치 출력은 어떤 방식으로 붙여야 하는가
5. leakage 없이 어떻게 학습용 supervision table을 만들 수 있는가
6. 마지막 head에서 MLP를 쓸 때 어떤 전제가 필요한가

---

## 1. 메타 테이블의 정의

`meta table` 은 서로 다른 데이터셋의 원본 고객을 직접 join 하는 테이블이 아니다.

정의:

```text
meta table
= 각 데이터셋에서 만든 panel sample들을
  공통 계약(common contract) 위에 세로로 쌓고,
  여기에 Branch A / B / C의 OOF representation과 summary score를 붙인
  최종 supervised training table
```

즉 한 행은 아래 의미를 가진다.

```text
한 행 = 하나의 panel sample
= (dataset_id, entity_id, as_of_date, horizon_id) 기준 샘플
```

예:

- `retailrocket_raw:visitor_123:2015-08-31:30d`
- `saas_subscription_churn:account_551:2024-06-30:30d`
- `olist:customer_abc:2018-05-31:90d`

이 세 행은 서로 다른 사람이어도 상관없다.
중요한 것은 모두가 동일한 supervision contract 위에 올라와 있다는 점이다.

---

## 2. 왜 메타 테이블이 필요한가

최종 `churn power` 모델은 raw 데이터를 직접 보지 않는다.

이유:

1. 데이터셋별 컬럼 구조가 너무 다르다.
2. 도메인별 feature 의미가 다르다.
3. raw concat은 leakage와 schema mismatch를 쉽게 일으킨다.
4. 프로젝트 목표는 cross-domain raw model이 아니라,
   브랜치별 risk representation을 합치는 최종 위험 요약기다.

따라서 먼저 해야 하는 일은 다음과 같다.

1. 각 데이터셋에서 panel sample 생성
2. Branch A / B / C canonical feature block 생성
3. 브랜치별 encoder에서 representation 추출
4. 그 결과를 동일 구조의 supervised table로 모으기

이 마지막 결과물이 `meta table` 이다.

---

## 3. 생성 원칙

## 3.1 raw join 금지

금지:

- `retailrocket` 사용자와 `saas` 사용자를 직접 join
- 데이터셋 간 customer id를 맞추려는 시도
- 서로 다른 도메인의 raw row를 같은 row에 억지로 결합

허용:

- 데이터셋별 panel sample 생성
- 같은 컬럼 계약으로 세로 적재
- 브랜치별 OOF output left join

## 3.2 공통 sample contract

모든 샘플은 최소 아래 index를 가져야 한다.

- `sample_id`
- `dataset_id`
- `domain_id`
- `entity_id`
- `as_of_date`
- `horizon_id`

권장:

```text
sample_id = "{dataset_id}:{entity_id}:{as_of_date}:{horizon_id}"
```

## 3.3 OOF 원칙

최종 head가 보는 브랜치 출력은 반드시 **out-of-fold(OOF)** 이어야 한다.

이유:

- 같은 샘플을 보고 학습한 브랜치 모델의 prediction/embedding을 final head에 넣으면 leakage가 생긴다.
- final head는 실제 generalization 상황과 유사한 representation을 입력으로 받아야 한다.

즉 아래 방식이 필요하다.

1. panel dataset을 time split fold로 분할
2. fold train으로 branch model 학습
3. fold valid에 대해서만 branch output 생성
4. 전체 valid output을 합쳐 OOF table 생성

---

## 4. 메타 테이블 생성 순서

```text
dataset raw/panel
-> sample_base 생성
-> branch A/B/C feature block 생성
-> branch별 OOF encoder output 생성
-> sample_base 와 branch outputs join
-> meta_table_train 생성
```

### Step 1. `sample_base` 생성

역할:

- 모든 샘플의 공통 index/target/meta 정보를 보관

### Step 2. `branch_a_oof`, `branch_b_oof`, `branch_c_oof` 생성

역할:

- 브랜치별 representation과 summary score 저장

### Step 3. join

역할:

- 최종 `meta_table_train` 완성

---

## 5. 권장 파일 구조

### 5.1 `sample_base`

필수 컬럼:

| 컬럼 | 설명 |
| --- | --- |
| `sample_id` | 샘플 고유 ID |
| `dataset_id` | 원본 데이터셋 이름 |
| `domain_id` | 상위 도메인 ID |
| `entity_id` | 사용자/고객/계정 ID |
| `as_of_date` | feature 절단 시점 |
| `panel_unit` | `week`, `month`, `billing_cycle`, `snapshot` |
| `horizon_id` | `30d`, `60d`, `90d`, `cycle` 등 |
| `branch_a_mask` | Branch A 정보 존재 여부 |
| `branch_b_mask` | Branch B 정보 존재 여부 |
| `branch_c_mask` | Branch C 정보 존재 여부 |
| `y_class_primary` | 기본 binary target |
| `y_reg_primary` | 기본 regression target |
| `y_churn_power` | 0~100 normalized target |
| `has_y_class` | classification label 존재 여부 |
| `has_y_reg` | regression label 존재 여부 |
| `has_y_power` | churn power label 존재 여부 |
| `sample_weight` | 샘플 가중치 |

### 5.2 `branch_a_oof`

필수 컬럼:

| 컬럼 | 설명 |
| --- | --- |
| `sample_id` | join key |
| `z_a_00 ... z_a_nn` | Branch A embedding |
| `score_a_activity_decay` | 활동 감소 요약 점수 |
| `score_a_value_drop` | 가치 하락 요약 점수 |

### 5.3 `branch_b_oof`

필수 컬럼:

| 컬럼 | 설명 |
| --- | --- |
| `sample_id` | join key |
| `z_b_00 ... z_b_nn` | Branch B embedding |
| `score_b_lifecycle_risk` | lifecycle risk 요약 점수 |
| `score_b_lockin_decay` | lock-in 감소 요약 점수 |

### 5.4 `branch_c_oof`

필수 컬럼:

| 컬럼 | 설명 |
| --- | --- |
| `sample_id` | join key |
| `z_c_00 ... z_c_nn` | Branch C embedding |
| `score_c_trust_damage` | 신뢰 손상 요약 점수 |
| `score_c_intervention_sensitivity` | 개입 민감도 요약 점수 |

### 5.5 최종 `meta_table_train`

구성:

```text
meta_table_train
= sample_base
  LEFT JOIN branch_a_oof USING(sample_id)
  LEFT JOIN branch_b_oof USING(sample_id)
  LEFT JOIN branch_c_oof USING(sample_id)
```

---

## 6. missing branch 처리 규칙

모든 샘플이 세 브랜치 출력을 완전히 가지지는 않는다.

예:

- `retailrocket_raw`: A 강함, B/C 약함
- `saas_subscription_churn`: B/C 강함, A도 일부 가능
- `olist`: A/C 강함, B는 약함

따라서 아래 규칙이 필요하다.

### 6.1 zero-fill + mask 동시 사용

브랜치가 비어 있을 때:

- `z_*` embedding은 0으로 채움
- branch score도 0으로 채움
- 대신 반드시 corresponding `mask = 0` 을 유지

예:

```text
branch_b_mask = 0
z_b_00 ... z_b_31 = 0
score_b_lifecycle_risk = 0
score_b_lockin_decay = 0
```

이렇게 해야 final head가
“정보가 없음” 과 “값이 실제로 0임” 을 구분할 수 있다.

---

## 7. 공통 target 설계

## 7.1 `y_class_primary`

권장 공통 binary target 예:

- `churn_next_30d`
- `inactive_next_30d`
- `non_renewal_next_cycle`
- `no_purchase_next_60d`

데이터셋마다 raw 정의는 달라도,
최종적으로는 “다음 horizon에서 유지 실패 또는 강한 이탈 유사 이벤트가 있었는가” 로 맞춘다.

## 7.2 `y_reg_primary`

권장 공통 regression target 예:

- `days_until_churn`
- `next_30d_spend`
- `next_30d_order_count`
- `next_30d_mrr_loss`
- `value_loss_ratio`

## 7.3 `y_churn_power`

권장 조합:

```text
y_churn_power
= alpha * churn_like_event
+ beta * activity_drop_ratio_future
+ gamma * value_loss_ratio_future
+ delta * trust_damage_proxy_future
```

원칙:

- 데이터셋별 raw target은 다를 수 있다.
- 하지만 최종 supervision은 공통 0~100 risk scale 위에 올려야 한다.

---

## 8. OOF 생성 요구사항

final head 학습 시 가장 중요한 요구사항은 **OOF branch output** 이다.

### 8.1 이유

- in-fold prediction/embedding 사용 시 leakage 발생
- final head가 과도하게 낙관적인 branch 출력을 학습하게 됨

### 8.2 요구사항

모든 branch output table은 아래 조건을 만족해야 한다.

1. panel row 기준 fold 분할
2. strict time panel dataset은 time split
3. valid fold에 대해서만 embedding / score 생성
4. 모든 valid fold를 합쳐 OOF table 구성

### 8.3 snapshot anchor 데이터 처리

`ecommerce_company_client_churn_data` 는 strict time panel이 아니므로,
보조 supervised anchor로만 사용한다.

원칙:

- branch pretraining 보조 가능
- final head 학습에는 sample weight를 낮게 둘 수 있음

---

## 9. 마지막 head에서 MLP가 맞는가

## 9.1 결론

현재 설계에서는 **작은 MLP가 기본 후보로 타당하다.**

이유:

1. 입력이 raw feature가 아니라 `embedding + summary score + mask` 구조다.
2. 브랜치 간 상호작용은 비선형일 가능성이 높다.
3. 최종 출력이 `classification + regression + churn power` multi-task와 잘 맞는다.

## 9.2 단, 비교 baseline 필요

반드시 같이 비교한다.

- Logistic Regression meta-head
- LightGBM / XGBoost meta-head
- small MLP meta-head

즉 문서상 기본 방향은 MLP지만,
최종 선택은 비교 실험 후 결정한다.

---

## 10. 권장 학습 파이프라인

1. core dataset panel 생성
2. `sample_base` 저장
3. branch feature block 생성
4. branch별 OOF encoder output 저장
5. `meta_table_train` 생성
6. final head 학습
7. calibration
8. FE `churnRisk` scale 로 정규화

---

## 11. 예시 row

```text
sample_id = retailrocket_raw:visitor_123:2015-08-31:30d
dataset_id = retailrocket_raw
domain_id = commerce
entity_id = visitor_123
as_of_date = 2015-08-31
horizon_id = 30d

branch_a_mask = 1
branch_b_mask = 0
branch_c_mask = 0

z_a_00 ... z_a_31 = ...
z_b_00 ... z_b_31 = 0
z_c_00 ... z_c_31 = 0

score_a_activity_decay = 0.72
score_a_value_drop = 0.55
score_b_lifecycle_risk = 0
score_b_lockin_decay = 0
score_c_trust_damage = 0
score_c_intervention_sensitivity = 0

y_class_primary = 1
y_reg_primary = 0.0
y_churn_power = 67.4
```

---

## 12. 완료 기준

이 문서 기준으로 `meta table` 설계가 준비되었다고 보려면 아래가 만족되어야 한다.

1. `sample_base`, `branch_a_oof`, `branch_b_oof`, `branch_c_oof`, `meta_table_train` 구조가 정의되어 있다.
2. branch missing 처리 규칙이 있다.
3. 공통 target 설계 원칙이 있다.
4. OOF 생성 원칙이 있다.
5. final head에서 MLP를 쓰는 justification과 baseline 비교 방침이 있다.
